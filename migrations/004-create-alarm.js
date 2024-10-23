'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Alarms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      audioFilename: {
        type: Sequelize.STRING,
        allowNull: true
      },
      alarmName: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      },
      toneName: { // New field
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "",
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Alarms');
  }
};
