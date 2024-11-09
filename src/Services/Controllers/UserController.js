const bcrypt = require('bcrypt');
const User = require('../../../models/user');
const Task = require('../../../models/task');
const Alarm = require('../../../models/alarm');
const DeveloperAssignment = require('../../../models/userAssignment');
const Joi = require('joi');
const { SendEmail } = require('../../libs/Helper');
const { NotificationAdd } = require('./../../libs/Helper');
const path = require('path');
const { generateTempPassword } = require('../../../utills/authUtils');
const jwt = require('jsonwebtoken');
const sequelize = require('../../../db/db');
const tempPassword = generateTempPassword();
const password = bcrypt.hashSync(tempPassword, bcrypt.genSaltSync(10), null);

const schema = Joi.object().keys({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});
const fs = require('fs');
const CryptoJS = require('crypto-js');

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const { promisify } = require('util');
const csv = require('csv-parser');

require('dotenv').config({
  path: __dirname + '/.env',
});

const Role = require('../../../models/role');
const { Op, fn, col } = require('sequelize');

// const io = require('../../../socket');

const admin = require('firebase-admin');
const serviceAccount = require('../../../nexusappbuild-firebase-adminsdk-ukuio-c799c2d93d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'nexusappbuild',
});

const sendNotification = async (fcmToken, title, body, taskId, createdAt, audioFile) => {
  console.log('audioFile', audioFile.replace('.wav', ''))
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: {
      taskId: taskId.toString(),
      createdAt: createdAt.toISOString(), // Ensure createdAt is converted to an ISO string
    },
    android: {
      priority: "high",
      notification: {
        title: title,
        body: body,
        sound: audioFile.replace('.wav', ''), // Use 'default' if no audioFile provided
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: title,
            body: body,
            contentAvailable: 1,
          },
          sound: {
            critical: 1,
            name: audioFile,
            volume: 1.0,
          },
        },
      },
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

module.exports.getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.query;

    // Validate input
    if (!role) {
      return res.status(400).send({ message: 'Role can not be empty!' });
    }

    // Find role by name
    const roleRecord = await Role.findOne({ where: { name: role } });
    if (!roleRecord) {
      return res.status(400).send({ message: 'Role not found' });
    }

    // Fetch users by role
    const users = await User.findAll({
      where: { roleId: roleRecord.id },
    });

    return res.status(200).send({
      success: true,
      message: 'Users fetched successfully',
      users: users,
    });
  } catch (error) {
    console.log('Error while trying to fetch users by role:', error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports.createUser = async (req, res, next) => {
  try {
    let { company, Name, email, phone, password, role } = req.body;
    // console.log('req.body++++++', req.body);
    // Validate input
    if (!email || !Name || !phone || !role) {
      return res.status(400).send({ message: 'Content can not be empty!' });
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send({ message: 'Invalid email format' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(400).send({
        success: false,
        message: 'Email already exists. Please try a different email.',
      });
    }

    // Find role by name
    const roleRecord = await Role.findOne({ where: { name: role } });
    if (!roleRecord) {
      return res.status(400).send({
        success: false,
        message: 'Role not found.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create User
    const newUser = await User.create({
      username: Name,
      email,
      phone,
      company: company ? company : '',
      password: hashedPassword,
      roleId: roleRecord.id,
    });

    return res.status(200).send({
      success: true,
      message: 'User has been created successfully',
    });
  } catch (error) {
    console.log('Error while trying to create user:', error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports.savefcmtoken = async (req, res, next) => {
  const { token, userId } = req.body;

  if (!token || !userId) {
    return res.status(400).json({ message: 'Token and userId are required' });
  }

  try {
    // Find user and update or create token
    const [user, created] = await User.upsert({
      id: userId,
      fcmToken: token,
    });

    res.status(200).json({ message: 'Token saved successfully', user });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { company, username, email, phone, password } = req.body;

    const existingUser = await User.findOne({
      where: {
        email: email,
        id: {
          [Op.ne]: id, // Exclude the current user's ID from the query
        },
      },
    });

    if (existingUser) {
      return res.status(400).send({ message: 'Email already exists' });
    }

    // Find user by id
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (password !== '1234==*1') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update User
      user.username = username;
      user.email = email;
      user.phone = phone;
      (user.company = company ? company : ''), (user.password = hashedPassword);
    } else {
      user.username = username;
      (user.company = company ? company : ''), (user.email = email);
      user.phone = phone;
    }

    await user.save();

    return res.status(200).send({
      success: true,
      message: 'Update successfully',
      user: user,
    });
  } catch (error) {
    console.log('Error while trying to update user:', error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports.updateClientsDeveloper = async (req, res) => {
  const { id } = req.params;
  const { selectedDevelopers, selectedProjectManager, selectedServerStaff } =
    req.body;

  if (
    !Array.isArray(selectedDevelopers) ||
    !selectedProjectManager ||
    !selectedServerStaff
  ) {
    return res.status(400).send({
      success: false,
      message: 'Please provide all required fields in the correct format',
    });
  }

  try {
    let userAssignment = await DeveloperAssignment.findOne({
      where: { userId: id },
    });

    if (!userAssignment) {
      userAssignment = await DeveloperAssignment.create({
        userId: id,
        developers: selectedDevelopers, // Ensure this is an array of developer IDs
        projectManagerId: selectedProjectManager,
        serverStaffId: selectedServerStaff,
      });
    } else {
      userAssignment.developers = selectedDevelopers; // Update developers field
      userAssignment.projectManagerId = selectedProjectManager;
      userAssignment.serverStaffId = selectedServerStaff;
      await userAssignment.save();
    }

    return res.status(200).send({
      success: true,
      message: 'Updated successfully',
      userAssignment,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate input
    if (!id) {
      return res.status(400).send({ message: 'ID cannot be empty!' });
    }

    // Find user by id
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    console.log('user', user);

    if (user.roleId === 2) {
      const assignments = await DeveloperAssignment.findAll({
        where: {
          [Op.and]: [
            fn('JSON_CONTAINS', col('developers'), JSON.stringify(id)),
          ],
        },
      });

      for (const assignment of assignments) {
        const developers = JSON.parse(assignment.developers);
        const updatedDevelopers = developers.filter((devId) => devId !== id);
        await assignment.update({
          developers: JSON.stringify(updatedDevelopers),
        });
      }
    }

    if (user.roleId === 3) {
      const tasks = await Task.findAll({ where: { clientId: id } });
      for (const task of tasks) {
        await task.destroy();
      }
    }

    // Delete User
    await user.destroy();

    return res.status(200).send({
      success: true,
      message: 'User has been deleted successfully',
    });
  } catch (error) {
    console.log('Error while trying to delete user:', error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

//saveusertestdetaisls///

module.exports.userLogoutStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user_detail = await User.findById({ _id: id });

    if (user_detail.role == 'user') {
      await User.updateOne({ _id: user_detail._id }, { status: 'InActive' });

      await UserActivity.updateOne(
        { userId: user_detail._id },
        { status: 'InActive' }
      );
    }

    res.status(200).json({ message: 'User logout status saved successfully' });
  } catch (error) {
    console.log('Error saving logout status:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while saving logout status' });
  }
};

function changeExtensionToWav(filename) {
  // Check if the filename ends with .mp3
  if (filename.endsWith('.mp3')) {
    // Replace the .mp3 extension with .wav
    return filename.replace('.mp3', '.wav');
  }
  // If not, return the original filename
  return filename;
}

module.exports.createClientAlert = async (req, res) => {
  try {
    const {
      role,
      description,
      clientId,
      developerId,
      projectManagerId,
      serverId,
      typeOfEmergency
    } = req.body;


    const types = ['', 'websiteDown', 'beingAttacked', 'holiday', 'others']

    console.log('types[typeOfEmergency]', types[typeOfEmergency])


    console.log('###req.body@', req.body)
    const allAlarm = await Alarm.findAll()
    console.log('allAlarm', allAlarm)

    // return res.status(201).json({ task: "test", soundName: allAlarm });
    const alarms = await Alarm.findAll({
      where: {
        alarmName: types[typeOfEmergency], // Use the toneName to filter the results
      },
    });

    console.log('alarms:', alarms)

    // Check if alarms were found
    if (alarms.length === 0) {
      console.log(`No alarms found with toneName: ${types[typeOfEmergency]}`);
      return res
        .status(400)
        .json({ message: `No alarms found with tone Name: ${types[typeOfEmergency]}` });
    }


    if (!description || !clientId) {
      return res
        .status(400)
        .json({ message: 'Description, and role are required' });
    }

    // const devloperAssign = await DeveloperAssignment.findAll();
    // console.log('Fetching data from the users table', devloperAssign.length);

    // // Fetch developerId from DeveloperAssignment model
    const developerAssignment = await DeveloperAssignment.findOne({
      where: {
        userId: clientId,
      },
    });
    ``
    if (!developerAssignment) {
      console.error('No developer assignment found for client ID', clientId);
      return res.status(404).json({ message: 'No developer assignment found' });
    }

    // Notification task create
    const task = await Task.create({
      description,
      clientId,
    });

    // console.log('task', task);
    let developerIDs = [];


    if (
      developerAssignment?.developers &&
      typeof developerAssignment.developers === 'string'
    ) {
      developerIDs = JSON.parse(developerAssignment.developers);
    } else {
      developerIDs = developerAssignment.developers;
    }


    console.log('developerAssignment.projectManagerId', developerAssignment.projectManagerId)
    console.log('typeof developerAssignment.projectManagerId', typeof developerAssignment.projectManagerId)
    console.log('developerAssignment.serverStaffId', developerAssignment.serverStaffId)
    console.log('typeof developerAssignment.serverStaffId', typeof developerAssignment.serverStaffId)

    console.log('developerIDs', developerIDs)
    developerIDs.push(developerAssignment.projectManagerId)
    developerIDs.push(developerAssignment.serverStaffId)
    console.log('developerIDs after push', developerIDs)




    // if (
    //   developerAssignment?.projectManagerId &&
    //   typeof developerAssignment.projectManagerId === 'string'
    // ) {
    //   developerIDs.push(JSON.parse(developerAssignment.projectManagerId))
    // } else {
    //   developerIDs = developerAssignment.developers;
    // }

    console.log('developers :- ', typeof developerIDs);

    const io = req.app.get('socketio');
    const taskId = task.id;
    const createdAt = new Date(task.createdAt);
    const audioFile = changeExtensionToWav(alarms[0].audioFilename)


    for (const developerID of developerIDs) {
      console.log('####developerID:', developerID);

      const user = await User.findOne({
        where: { id: developerID },
      });

      if (user) {
        const data = { task, developerID };

        // console.log('####io.emitdata:', data);
        io.emit('newAlert', data); // Emit the alert to each developer

        if (!user.fcmToken) {
          console.log('User FcmToken Not Found', developerID);
        }

        if (user.fcmToken) {
          try {
            await sendNotification(
              user.fcmToken,
              'New Task Alert',
              `A new task has been created: ${description}`,
              taskId,
              createdAt,
              audioFile,
            );
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
          }
        }
      }
    }

    const emergencySoundDetails = {
      originalName: audioFile,
      emergencyType: alarms[0].alarmName,
    }

    res.status(201).json({ task, emergencySoundDetails });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.updateClientAlert = async (req, res) => {
  try {
    const { taskid, developerId, timetaken, role } = req.body;

    // console.log(' req.body;+++', req.body);
    if (!taskid || !developerId) {
      return res
        .status(400)
        .json({ message: 'taskid and developerId are required' });
    }

    let columnName;

    switch (role) {
      case 'client':
        columnName = 'clientId'
        break;
      case 'developer':
        columnName = 'developerId'
        break;
      case 'projectmanager':
        columnName = 'projectManagerId'
        break;
      case 'server':
        columnName = 'serverId'
        break;
      default:
        break;
    }


    const task = await Task.update(
      { status: 'pickup', [columnName]: developerId, timetaken: timetaken },
      { where: { id: taskid } }
    );

    const updatedTask = await Task.findByPk(taskid);

    const io = req.app.get('socketio'); // Get `io` instance from `app`
    const data = { updatedTask, taskid };

    io.emit('pickupAlert', data);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(201).json(updatedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// module.exports.getALLAlerts = async (req, res) => {
//   try {
//     const tasks = await Task.findAll({
//       include: [
//         { model: User, as: "Client", attributes: { exclude: ["password"] } },
//         { model: User, as: "Developer", attributes: { exclude: ["password"] } },
//         {
//           model: User,
//           as: "ProjectManager",
//           attributes: { exclude: ["password"] },
//         },
//         { model: User, as: "Server", attributes: { exclude: ["password"] } },
//       ],
//     });

//     res.status(201).json(tasks);
//   } catch (error) {
//     console.error("Error creating task:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

module.exports.getALLAlerts = async (req, res) => {
  try {
    // Fetch all alarms from the database
    const tasks = await Task.findAll({
      include: [
        { model: User, as: 'Client', attributes: { exclude: ['password'] } },
        { model: User, as: 'Developer', attributes: { exclude: ['password'] } },
        {
          model: User,
          as: 'ProjectManager',
          attributes: { exclude: ['password'] },
        },
        { model: User, as: 'Server', attributes: { exclude: ['password'] } },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Send response with alarms data
    res.status(200).json({ success: true, alarms: tasks });
  } catch (error) {
    console.error('Error fetching alarms:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports.getIdBasedAlerts = async (req, res) => {
  const { Username, id } = req.body;

  try {
    console.log('User', Username);
    console.log('id', id);

    let tasks;
    if (Username === 'client') {
      tasks = await Task.findAll({
        where: { clientId: id },
        include: [
          { model: User, as: 'Client', attributes: { exclude: ['password'] } },
          {
            model: User,
            as: 'Developer',
            attributes: { exclude: ['password'] },
          },
          {
            model: User,
            as: 'ProjectManager',
            attributes: { exclude: ['password'] },
          },
          { model: User, as: 'Server', attributes: { exclude: ['password'] } },
        ],
        order: [['createdAt', 'DESC']],
      });
      return res.status(200).json({ success: true, tasks });
    } else if (Username === 'developer') {
      const developerAssignments = await DeveloperAssignment.findAll({
        where: sequelize.fn(
          'JSON_CONTAINS',
          sequelize.col('developers'),
          sequelize.json(`"${id}"`)
        ),
        attributes: ['userId'],
      });

      // console.log("developerAssignments", developerAssignments);

      const userIds = developerAssignments.map(
        (assignment) => assignment.userId
      );
      console.log('userIds', userIds);

      // Fetch tasks for each client ID
      const tasksPromises = userIds.map((clientId) => {
        return Task.findAll({
          where: { clientId },
          include: [
            {
              model: User,
              as: 'Client',
              attributes: { exclude: ['password'] },
            },
            {
              model: User,
              as: 'Developer',
              attributes: { exclude: ['password'] },
            },
            {
              model: User,
              as: 'ProjectManager',
              attributes: { exclude: ['password'] },
            },
            {
              model: User,
              as: 'Server',
              attributes: { exclude: ['password'] },
            },
          ],
          order: [['createdAt', 'DESC']],
        });
      });

      let allTasksArrays = await Promise.all(tasksPromises);

      // Flatten the array of arrays into a single array
      const allTasks = allTasksArrays.flat();

      // Sort tasks by `createdAt` in descending order
      const sortedTasks = allTasks.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return res.status(200).json({ success: true, tasks: sortedTasks });
    } else if (Username === 'projectmanager') {
      // Fetching assignments for the project manager
      const projectManagerAssignments = await DeveloperAssignment.findAll({
        where: {
          projectManagerId: id
        },
        attributes: ['userId'],
      });

      // Extract userIds from projectManagerAssignments
      const userIds = projectManagerAssignments.map(
        (assignment) => assignment.userId
      );
      console.log('userIds', userIds);

      // Fetch tasks for each user ID
      const tasksPromises = userIds.map((userId) => {
        return Task.findAll({
          where: { clientId: userId }, // Assuming clientId is the same as userId
          include: [
            {
              model: User,
              as: 'Client',
              attributes: { exclude: ['password'] },
            },
            {
              model: User,
              as: 'Developer',
              attributes: { exclude: ['password'] },
            },
            {
              model: User,
              as: 'ProjectManager',
              attributes: { exclude: ['password'] },
            },
            {
              model: User,
              as: 'Server',
              attributes: { exclude: ['password'] },
            },
          ],
          order: [['createdAt', 'DESC']],
        });
      });

      // Wait for all task promises to resolve
      let allTasksArrays = await Promise.all(tasksPromises);

      // Flatten the array of arrays into a single array
      const allTasks = allTasksArrays.flat();

      // Sort tasks by `createdAt` in descending order
      const sortedTasks = allTasks.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Return the sorted tasks in the response
      return res.status(200).json({ success: true, tasks: sortedTasks });
    } else if (Username === 'server') {
      // Fetching assignments for the server staff
      const serverStaffAssignments = await DeveloperAssignment.findAll({
        where: {
          serverStaffId: id
        },
        attributes: ['userId'],
      });

      // Extract userIds from serverStaffAssignments
      const userIds = serverStaffAssignments.map(
        (assignment) => assignment.userId
      );
      console.log('userIds', userIds);

      // Fetch tasks for each user ID
      const tasksPromises = userIds.map((userId) => {
        return Task.findAll({
          where: { clientId: userId }, // Assuming clientId is the same as userId
          include: [
            {
              model: User,
              as: 'Client',
              attributes: { exclude: ['password'] },
            },
            {
              model: User,
              as: 'Developer',
              attributes: { exclude: ['password'] },
            },
            {
              model: User,
              as: 'ProjectManager',
              attributes: { exclude: ['password'] },
            },
            {
              model: User,
              as: 'Server',
              attributes: { exclude: ['password'] },
            },
          ],
          order: [['createdAt', 'DESC']],
        });
      });

      // Wait for all task promises to resolve
      let allTasksArrays = await Promise.all(tasksPromises);

      // Flatten the array of arrays into a single array
      const allTasks = allTasksArrays.flat();

      // Sort tasks by `createdAt` in descending order
      const sortedTasks = allTasks.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Return the sorted tasks in the response
      return res.status(200).json({ success: true, tasks: sortedTasks });
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports.getUsersDeveloperById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Fetch developer assignments by user ID
    const assignment = await DeveloperAssignment.findOne({
      where: { userId: id },
      include: [
        {
          model: User,
          as: 'ProjectManager',
          attributes: ['username'],
        },
        {
          model: User,
          as: 'ServerStaff',
          attributes: ['username'],
        },
      ],
    });

    if (!assignment) {
      return res.status(200).send({
        success: false,
        message: 'No assignments found',
        users: {
          developers: [],
          projectManagerId: null,
          serverStaffId: null,
        },
      });
    }
    let assignedDev = assignment.developers;

    if (typeof assignedDev == 'string') {
      assignedDev = JSON.parse(assignedDev);
    }

    // Ensure assignment.developers is an array
    const developerIds = Array.isArray(assignedDev) ? assignedDev : [];

    // Fetch developer details only if developerIds is an array and not empty
    const developers =
      developerIds.length > 0
        ? await User.findAll({
          where: {
            id: {
              [Op.in]: developerIds, // Use Op.in to filter by multiple IDs
            },
          },
          attributes: ['id', 'username'],
        })
        : [];

    return res.status(200).send({
      success: true,
      message: 'Users fetched successfully',
      users: {
        developers: developers.map((dev) => ({
          id: dev.id,
          username: dev.username,
        })),
        projectManagerId: assignment.projectManagerId,
        serverStaffId: assignment.serverStaffId,
      },
    });
  } catch (error) {
    console.log('Error while trying to fetch users by role:', error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports.getALLUser = async (req, res) => {
  try {
    const user = await User.findAll();

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error fetching alarms:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports.getTaskDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findOne({
      where: { id },
      include: [
        { model: User, as: 'Client', attributes: { exclude: ['password'] } },
        { model: User, as: 'Developer', attributes: { exclude: ['password'] } },
        {
          model: User,
          as: 'ProjectManager',
          attributes: { exclude: ['password'] },
        },
        { model: User, as: 'Server', attributes: { exclude: ['password'] } },
      ],
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }

    // Send response with task details
    res.status(200).json({ success: true, task });
  } catch (error) {
    console.error('Error fetching alarms:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
