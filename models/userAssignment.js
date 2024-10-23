"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../db/db");
const User = require("./user"); // Import User model

const DeveloperAssignment = sequelize.define(
  "DeveloperAssignment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false, 
    },
    developers: {
      type: DataTypes.JSON, 
      allowNull: true,
    },
    projectManagerId: {
      type: DataTypes.INTEGER,
      allowNull: true,

    },
    serverStaffId: {
      type: DataTypes.INTEGER,
      allowNull: true,

    },
  },
  {
    timestamps: true,
    tableName: "DeveloperAssignments", 
  }
);

// Define associations
DeveloperAssignment.belongsTo(User, { as: "ProjectManager", foreignKey: "projectManagerId" });
DeveloperAssignment.belongsTo(User, { as: "ServerStaff", foreignKey: "serverStaffId" });

module.exports = DeveloperAssignment;
