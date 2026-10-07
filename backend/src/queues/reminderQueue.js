const { FlexibleQueue } = require('../config/redis');
const { sendEmail } = require('../config/nodemailer');
const Reminder = require('../models/Reminder');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

const processReminderJob = async (jobData) => {
  const { reminderId, appointmentId, patientId, reminderType } = jobData;
  console.log(`[ReminderQueue] Processing reminder job for appointment ${appointmentId}...`);

  const appointment = await Appointment.findById(appointmentId).populate('patientId doctorId clinicId');
  if (!appointment) {
    console.warn(`[ReminderQueue] Appointment ${appointmentId} not found. Skipping.`);
    return;
  }

  const patient = appointment.patientId;
  const doctor = appointment.doctorId;

  let subject = `Appointment Reminder - ApexCare Health`;
  let text = `Hello ${patient ? patient.fullName : 'Patient'},\n\nThis is a friendly reminder for your upcoming appointment on ${appointment.appointmentDate} at ${appointment.timeSlot} with Dr. ${doctor ? doctor.name : 'your doctor'}.\n\nPlease arrive 10 minutes prior to your scheduled time slot.\n\nBest regards,\nApexCare Health Team`;

  if (reminderType === 'FOLLOW_UP') {
    subject = `Follow-up Health Check Reminder`;
    text = `Hello ${patient ? patient.fullName : 'Patient'},\n\nYour recommended follow-up date is coming up on ${appointment.followUpDate}. Please contact your clinic to schedule your checkup.\n\nBest regards,\nApexCare Health Team`;
  }

  if (patient && patient.email) {
    await sendEmail({ to: patient.email, subject, text });
  }

  if (reminderId) {
    await Reminder.findByIdAndUpdate(reminderId, { status: 'SENT', sentAt: new Date() });
  }

  await Appointment.findByIdAndUpdate(appointmentId, { reminderSent: true });
};

const reminderQueue = new FlexibleQueue('reminderQueue', processReminderJob);

const scheduleAppointmentReminder = async (appointment, reminderType = 'APPOINTMENT_24H', delayMs = 1000) => {
  try {
    const reminder = await Reminder.create({
      clinicId: appointment.clinicId,
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      scheduledFor: new Date(Date.now() + delayMs),
      reminderType,
      status: 'PENDING'
    });

    await reminderQueue.add('send_reminder', {
      reminderId: reminder._id,
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      reminderType
    }, { delay: delayMs });

    console.log(`[ReminderQueue] Reminder scheduled for appointment ${appointment._id}`);
  } catch (err) {
    console.error('[ReminderQueue] Error scheduling reminder:', err.message);
  }
};

module.exports = { reminderQueue, scheduleAppointmentReminder };
