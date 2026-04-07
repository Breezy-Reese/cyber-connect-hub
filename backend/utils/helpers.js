const moment = require('moment');

function formatTimeRemaining(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function calculateCost(startTime, hourlyRate) {
  const duration = moment().diff(moment(startTime), 'seconds');
  const hours = duration / 3600;
  return hours * hourlyRate;
}

function generateTicketCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

module.exports = {
  formatTimeRemaining,
  calculateCost,
  generateTicketCode
};