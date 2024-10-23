import { Box, Typography, Button, TextField, IconButton, InputAdornment } from "@mui/material";
import React, { useState, useEffect } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Collapse from "@mui/material/Collapse";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function Developers() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [open, setOpen] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameAccError, setNameAccError] = useState("");
  const [emailAccError, setEmailAccError] = useState("");
  const [phoneAccError, setPhoneAccError] = useState("");
  const [passwordAccError, setPasswordAccError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    Name: "",
    phone: "",
    email: "",
    password: "",
    role: 'projectmanager'
  });

  const handleModalOpen = () => setModalOpen(true);
  const handleModalClose = () => {
    setModalOpen(false);
    setNewAccountData({
      Name: "",
      phone: "",
      email: "",
      password: "",
      role: 'projectmanager'
    });
    setNameAccError();
    setEmailAccError();
    setPhoneAccError();
    setPasswordAccError();
  }

  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const HeaderAuthorization = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
  const role = "projectmanager";

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/get-user-by-role?role=${role}`, {
        ...HeaderAuthorization,
        method: "GET",
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      return;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpen = (user) => {
    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      password: "1234==*1",
    });
    setOpen(true);
    setOpenDel(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpenDel = (user) => {
    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      password: user.password,
    });
    setOpenDel(true);
    setOpen(false);
  };

  const handleCloseDel = () => {
    setOpenDel(false);
  };

  const validateForm = () => {
    let valid = true;

    // Validate name
    if (formData.username.trim() === "") {
      setNameError("Name cannot be empty");
      valid = false;
    } else {
      setNameError("");
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() === "") {
      setEmailError("Email cannot be empty");
      valid = false;
    } else if (!emailRegex.test(formData.email)) {
      setEmailError("Invalid email format");
      valid = false;
    } else {
      setEmailError("");
    }

    // Validate phone number (basic validation for demonstration)
    const phoneRegex = /^\d{10}$/;
    if (formData.phone.trim() === "") {
      setPhoneError("Phone number cannot be empty");
      valid = false;
    } else if (!phoneRegex.test(formData.phone)) {
      setPhoneError("Invalid phone number format");
      valid = false;
    } else {
      setPhoneError("");
    }

    if (formData.password.trim() === "") {
      setPasswordError("Password cannot be empty");
      valid = false;
    } else if (formData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    } else {
      setPasswordError("");
    }
    return valid;
  };

  const handleEdit = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      const response = await fetch(`${API_URL}/update-user/${formData.id}`, {
        ...HeaderAuthorization,
        method: "PUT",
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message, {
          duration: 2000,
        });
        fetchUsers();
        handleClose();
      } else {
        const data = await response.json();
        toast.error(data.message, {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [field]: value,
    }));

    // Clear corresponding error when user starts typing again
    switch (field) {
      case "username":
        setNameError("");
        break;
      case "email":
        setEmailError("");
        break;
      case "phone":
        setPhoneError("");
        break;
      default:
        break;
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `${API_URL}/delete-user/${formData.id}`,
        {
          ...HeaderAuthorization,
          method: "DELETE",
        }
      );
      if (response.ok) {
        toast.success("User deleted successfully", {
          duration: 2000,
        });
        fetchUsers();
        handleCloseDel();
      } else {
        toast.error("Failed to delete user. Try again later.", {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const goToNextPage = () => {
    if (currentPage < Math.ceil(users?.length / usersPerPage)) {
      setCurrentPage(currentPage + 1);
      handleClose();
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      handleClose();
    }
  };

  // Calculate the users to display based on the current page
  const currentUsers = users?.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const validateAccountForm = () => {
    let valid = true;

    // Validate name
    if (newAccountData.Name.trim() === "") {
      setNameAccError("Name cannot be empty");
      valid = false;
    } else {
      setNameAccError("");
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newAccountData.email.trim() === "") {
      setEmailAccError("Email cannot be empty");
      valid = false;
    } else if (!emailRegex.test(newAccountData.email)) {
      setEmailAccError("Invalid email format");
      valid = false;
    } else {
      setEmailAccError("");
    }

    // Validate phone number (basic validation for demonstration)
    const phoneRegex = /^\d{10}$/;
    if (newAccountData.phone.trim() === "") {
      setPhoneAccError("Phone number cannot be empty");
      valid = false;
    } else if (!phoneRegex.test(newAccountData.phone)) {
      setPhoneAccError("Invalid phone number format");
      valid = false;
    } else {
      setPhoneAccError("");
    }

    if (newAccountData.password.trim() === "") {
      setPasswordAccError("Password cannot be empty");
      valid = false;
    } else if (newAccountData.password.length < 8) {
      setPasswordAccError("Password must be at least 8 characters");
      valid = false;
    } else {
      setPasswordAccError("");
    }
    return valid;
  };


  const handleNewAccountChange = (e) => {
    setNewAccountData({ ...newAccountData, [e.target.name]: e.target.value });
  };

  const handleCreateAccount = async () => {

    if (!validateAccountForm()) {
      return;
    }

    const response = await fetch(`${API_URL}/create-user`, {
      ...HeaderAuthorization,
      method: "POST",
      body: JSON.stringify(newAccountData),
    });
    const data = await response.json();
    if (response.ok) {
      toast.success(data.message, {
        duration: 2000,
      });
      fetchUsers();
      setNewAccountData({
        Name: "",
        phone: "",
        email: "",
        password: "",
        role: 'projectmanager'
      });
    } else {
      toast.error(data.message, {
        duration: 2000,
      });
      console.error("Failed to fetch users");
    }
    handleModalClose();
  };

  return (
    <React.Fragment>
      <Box className="page_heding">
        <Box className="heading_inner">
          <Box className="heading_icn_head">
            <Box className="heading_icon">
              <svg
                width="32"
                height="36"
                viewBox="0 0 24 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 6.49799C9 6.89195 9.0776 7.28206 9.22836 7.64604C9.37913 8.01001 9.6001 8.34073 9.87868 8.61931C10.1573 8.89788 10.488 9.11886 10.852 9.26962C11.2159 9.42039 11.606 9.49799 12 9.49799C12.394 9.49799 12.7841 9.42039 13.1481 9.26962C13.512 9.11886 13.8427 8.89788 14.1213 8.61931C14.3999 8.34073 14.6209 8.01001 14.7716 7.64604C14.9224 7.28206 15 6.89195 15 6.49798C15 6.10402 14.9224 5.71391 14.7716 5.34993C14.6209 4.98596 14.3999 4.65524 14.1213 4.37666C13.8427 4.09809 13.512 3.87711 13.148 3.72635C12.7841 3.57558 12.394 3.49799 12 3.49799C11.606 3.49799 11.2159 3.57558 10.8519 3.72635C10.488 3.87711 10.1573 4.09809 9.87868 4.37667C9.6001 4.65524 9.37912 4.98596 9.22836 5.34994C9.0776 5.71391 9 6.10402 9 6.49799L9 6.49799Z"
                  stroke="#ffff"
                  strokeWidth="2"
                />
                <path
                  d="M4.43781 14.3995C4.09663 14.5965 3.79758 14.8587 3.55775 15.1713C3.31792 15.4838 3.142 15.8406 3.04004 16.2211C2.93807 16.6017 2.91206 16.9985 2.96348 17.3891C3.0149 17.7797 3.14275 18.1564 3.33974 18.4976C3.53672 18.8388 3.79897 19.1378 4.11153 19.3776C4.42408 19.6175 4.78081 19.7934 5.16136 19.8953C5.5419 19.9973 5.9388 20.0233 6.32939 19.9719C6.71999 19.9205 7.09663 19.7926 7.43781 19.5956C7.779 19.3987 8.07804 19.1364 8.31787 18.8238C8.5577 18.5113 8.73362 18.1546 8.83559 17.774C8.93756 17.3935 8.96357 16.9966 8.91215 16.606C8.86072 16.2154 8.73287 15.8387 8.53589 15.4976C8.33891 15.1564 8.07665 14.8573 7.7641 14.6175C7.45154 14.3777 7.09481 14.2018 6.71427 14.0998C6.33373 13.9978 5.93683 13.9718 5.54623 14.0232C5.15564 14.0747 4.779 14.2025 4.43781 14.3995L4.43781 14.3995Z"
                  stroke="#ffff"
                  strokeWidth="2"
                />
                <path
                  d="M19.5622 14.3995C19.9034 14.5965 20.2024 14.8587 20.4422 15.1713C20.6821 15.4838 20.858 15.8406 20.96 16.2211C21.0619 16.6017 21.0879 16.9986 21.0365 17.3891C20.9851 17.7797 20.8572 18.1564 20.6603 18.4976C20.4633 18.8388 20.201 19.1378 19.8885 19.3776C19.5759 19.6175 19.2192 19.7934 18.8386 19.8953C18.4581 19.9973 18.0612 20.0233 17.6706 19.9719C17.28 19.9205 16.9034 19.7926 16.5622 19.5956C16.221 19.3987 15.922 19.1364 15.6821 18.8238C15.4423 18.5113 15.2664 18.1546 15.1644 17.774C15.0624 17.3935 15.0364 16.9966 15.0879 16.606C15.1393 16.2154 15.2671 15.8387 15.4641 15.4976C15.6611 15.1564 15.9234 14.8573 16.2359 14.6175C16.5485 14.3777 16.9052 14.2018 17.2857 14.0998C17.6663 13.9978 18.0632 13.9718 18.4538 14.0232C18.8444 14.0747 19.221 14.2025 19.5622 14.3995L19.5622 14.3995Z"
                  stroke="#ffff"
                  strokeWidth="2"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.06962 7.14117C9.02341 6.93052 8.99993 6.71498 8.99993 6.49829C8.99993 6.10432 9.07753 5.71422 9.22829 5.35024C9.30001 5.17711 9.3876 5.0115 9.48973 4.85545C9.17327 4.94737 8.86149 5.05677 8.55584 5.18337C7.46391 5.63567 6.47176 6.2986 5.63603 7.13433C4.80031 7.97006 4.13737 8.96221 3.68508 10.0541C3.23279 11.1461 3 12.3164 3 13.4983C3 14.2235 3.08765 14.9444 3.25988 15.6454C3.34396 15.479 3.44359 15.3203 3.55768 15.1716C3.79752 14.859 4.09656 14.5968 4.43774 14.3998C4.62541 14.2914 4.82381 14.204 5.02936 14.1387C5.00983 13.9262 5 13.7125 5 13.4983C5 12.579 5.18106 11.6688 5.53284 10.8195C5.88462 9.97023 6.40024 9.19855 7.05025 8.54854C7.63547 7.96332 8.31932 7.48703 9.06962 7.14117ZM14.9303 7.14112C15.6806 7.48698 16.3645 7.96328 16.9497 8.54854C17.5998 9.19855 18.1154 9.97022 18.4672 10.8195C18.8189 11.6688 19 12.579 19 13.4983C19 13.7125 18.9902 13.9262 18.9706 14.1387C19.1761 14.204 19.3745 14.2915 19.5621 14.3998C19.9033 14.5968 20.2023 14.859 20.4422 15.1716C20.5563 15.3203 20.656 15.4791 20.7401 15.6456C20.9123 14.9445 21 14.2236 21 13.4983C21 12.3164 20.7672 11.1461 20.3149 10.0541C19.8626 8.9622 19.1997 7.97005 18.364 7.13432C17.5282 6.2986 16.5361 5.63566 15.4441 5.18337C15.1385 5.05675 14.8266 4.94733 14.5101 4.85541C14.6122 5.01147 14.6999 5.17709 14.7716 5.35024C14.9223 5.71421 14.9999 6.10432 14.9999 6.49829C14.9999 6.71497 14.9765 6.93048 14.9303 7.14112ZM18.2303 19.9931C18.0439 20.0036 17.8565 19.9967 17.6705 19.9722C17.2799 19.9208 16.9033 19.7929 16.5621 19.5959C16.3746 19.4877 16.1998 19.3597 16.0405 19.2144C15.6169 19.5139 15.1603 19.766 14.6788 19.9654C13.8295 20.3172 12.9193 20.4983 12 20.4983C11.0807 20.4983 10.1705 20.3172 9.32122 19.9654C8.83965 19.766 8.38304 19.5138 7.95941 19.2144C7.80015 19.3596 7.62531 19.4876 7.43775 19.5959C7.09656 19.7929 6.71992 19.9208 6.32932 19.9722C6.1434 19.9967 5.95604 20.0036 5.7697 19.9932C6.5768 20.7674 7.52156 21.3848 8.55585 21.8132C9.64778 22.2655 10.8181 22.4983 12 22.4983C13.1819 22.4983 14.3522 22.2655 15.4442 21.8132C16.4784 21.3848 17.4232 20.7674 18.2303 19.9931Z"
                  fill="#ffff"
                />
              </svg>
            </Box>
            <Typography component="h1" variant="h1">
              Project Managers
            </Typography>
          </Box>
          <Box className="head_butn">
            <Button className="common_buttn-desgn" onClick={handleModalOpen}>New ProjectManager</Button>
          </Box>
        </Box>
      </Box>
      <Box className="page_content">
        <Box className="page_table">
          <TableContainer component={Paper} className="custom_table">
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell className="num_title">Edit / Delete</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Data section */}
                {currentUsers?.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                      key={user.id}>
                      <TableCell>
                        <Typography variant="span" component="span">
                          {user.username}
                        </Typography>
                      </TableCell>
                      <TableCell className="table_name">
                        <Typography variant="span" component="span">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="span" component="span">
                          {user.phone}
                        </Typography>
                      </TableCell>
                      <TableCell className="edit_delete">
                        <Box className="actions">
                          <Button
                            className="act_btn edit"
                            onClick={() => handleOpen(user)}>
                            Edit
                          </Button>
                          <Button
                            className="act_btn delete"
                            onClick={() => handleOpenDel(user)}>
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>


                    {/* Edit section */}
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={4}
                        className="collapsable_table edit_delete_collps">
                        <Collapse in={open && formData.id === user.id} timeout="auto" unmountOnExit>
                          <Table aria-label="simple table">
                            <TableBody>
                              <TableRow
                                sx={{
                                  "&:last-child td, &:last-child th": { border: 0 },
                                }}>
                                <TableCell className="company">
                                  <Typography variant="span" component="span">
                                    {formData.username}
                                  </Typography>
                                </TableCell>
                                <TableCell className="contact_name">
                                  <Typography variant="span" component="span">
                                    {formData.email}
                                  </Typography>
                                </TableCell>
                                <TableCell className="phone">
                                  <Typography variant="span" component="span">
                                    {formData.phone}
                                  </Typography>
                                </TableCell>
                                <TableCell className="edit_delect_close">
                                  <Button
                                    className="email_selector"
                                    onClick={handleClose}>
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg">
                                      <path
                                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M15 9L9 15"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M9 9L15 15"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </Button>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  style={{ paddingBottom: 0, paddingTop: 0 }}
                                  colSpan={4}
                                  className="collaps_nested">
                                  <Collapse in={open} timeout="auto" unmountOnExit>
                                    <Table aria-label="edit table">
                                      <TableBody>
                                        <TableRow>
                                          <TableCell className="platform_val">
                                            <Typography
                                              variant="span"
                                              component="span">
                                              Name
                                            </Typography>
                                          </TableCell>
                                          <TableCell className="platform_val">
                                            <TextField
                                              id="username"
                                              placeholder="Enter name"
                                              value={formData.username}
                                              onChange={(e) =>
                                                handleInputChange(
                                                  "username",
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </TableCell>
                                        </TableRow>
                                        {nameError && (
                                          <Typography variant="body2" color="error">
                                            {nameError}
                                          </Typography>
                                        )}
                                        <TableRow>
                                          <TableCell className="platform_val">
                                            <Typography
                                              variant="span"
                                              component="span">
                                              Email
                                            </Typography>
                                          </TableCell>
                                          <TableCell className="platform_val">
                                            <TextField
                                              id="email"
                                              placeholder="Enter email"
                                              value={formData.email}
                                              onChange={(e) =>
                                                handleInputChange(
                                                  "email",
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </TableCell>
                                        </TableRow>
                                        {emailError && (
                                          <Typography color="error">
                                            {emailError}
                                          </Typography>
                                        )}
                                        <TableRow>
                                          <TableCell className="platform_val">
                                            <Typography
                                              variant="span"
                                              component="span">
                                              Phone
                                            </Typography>
                                          </TableCell>
                                          <TableCell className="platform_val">
                                            <TextField
                                              id="phone"
                                              placeholder="Enter phone"
                                              value={formData.phone}
                                              onChange={(e) =>
                                                handleInputChange(
                                                  "phone",
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </TableCell>
                                        </TableRow>
                                        {phoneError && (
                                          <Typography variant="body2" color="error">
                                            {phoneError}
                                          </Typography>
                                        )}
                                        <TableRow>
                                          <TableCell className="platform_val">
                                            <Typography variant="span" component="span">
                                              Password
                                            </Typography>
                                          </TableCell>
                                          <TableCell className="platform_val">
                                            <TextField
                                              id="password"
                                              type="password"
                                              placeholder="Enter password"
                                              value={formData.password}
                                              onChange={(e) => handleInputChange("password", e.target.value)}
                                            />
                                          </TableCell>
                                        </TableRow>
                                        {passwordError && (
                                          <Typography variant="body2" color="error">
                                            {passwordError}
                                          </Typography>
                                        )}
                                        <TableRow>
                                          <TableCell className="platform_val">
                                            <Typography
                                              variant="span"
                                              component="span"></Typography>
                                          </TableCell>
                                          <TableCell className="platform_val submit_save">
                                            <Box className="save_btn">
                                              <Button
                                                className="act_btn"
                                                onClick={handleEdit}>
                                                Save
                                              </Button>
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>

                    {/* Delete section */}
                    <TableRow>
                      <TableCell
                        style={{ paddingBottom: 0, paddingTop: 0 }}
                        colSpan={4}
                        className="collapsable_table edit_delete_collps">
                        <Collapse in={openDel && formData.id === user.id} timeout="auto" unmountOnExit>
                          <Table aria-label="simple table">
                            <TableBody>
                              <TableRow
                                sx={{
                                  "&:last-child td, &:last-child th": { border: 0 },
                                }}>
                                <TableCell className="company">
                                  <Typography variant="span" component="span">
                                    {formData.username}
                                  </Typography>
                                </TableCell>
                                <TableCell className="contact_name">
                                  <Typography variant="span" component="span">
                                    {formData.email}
                                  </Typography>
                                </TableCell>
                                <TableCell className="phone">
                                  <Typography variant="span" component="span">
                                    {formData.phone}
                                  </Typography>
                                </TableCell>
                                <TableCell className="edit_delect_close">
                                  <Button
                                    className="email_selector"
                                    onClick={handleCloseDel}>
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg">
                                      <path
                                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M15 9L9 15"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M9 9L15 15"
                                        stroke="black"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </Button>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell
                                  colSpan={4}
                                  className="collaps_nested deleting_row">
                                  <Table aria-label="simple table">
                                    <TableBody>
                                      <TableRow
                                        sx={{
                                          "&:last-child td, &:last-child th": {
                                            border: 0,
                                          },
                                        }}>
                                        <TableCell className="platform_val">
                                          <Typography
                                            variant="span"
                                            component="span"
                                            className="deleting">
                                            You want to delete {formData.username}
                                          </Typography>
                                        </TableCell>
                                        <TableCell className="platform_val">
                                          <Box className="actions">
                                            <Button
                                              className="act_btn delete"
                                              onClick={handleDelete}>
                                              Delete
                                            </Button>
                                            <Button
                                              className="act_btn cancle"
                                              onClick={handleCloseDel}>
                                              Cancel
                                            </Button>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}

              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {users?.length > 10 && (
            <Box className="navigation bottom">
              <Button
                className="navig_buttn"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}>
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M13.75 21.25L7.5 15L13.75 8.75"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22.5 21.25L16.25 15L22.5 8.75"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
              <Button
                className="navig_buttn"
                onClick={goToNextPage}
                disabled={
                  currentPage === Math.ceil(users?.length / usersPerPage)
                }>
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.25 21.25L22.5 15L16.25 8.75"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.5 21.25L13.75 15L7.5 8.75"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </Box>
          )}
        </Box>
      </Box>
      <Dialog
        open={modalOpen}
        onClose={handleModalClose}
        PaperProps={{
          style: {
            width: '700px',
          },
        }}
      >
        <DialogTitle>Create New Account</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="Name"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newAccountData.Name}
            onChange={handleNewAccountChange}
          />
          {nameAccError && (
            <Typography variant="body2" color="error">
              {nameAccError}
            </Typography>
          )}
          <TextField
            margin="dense"
            name="phone"
            label="Phone"
            type="text"
            fullWidth
            variant="outlined"
            value={newAccountData.phone}
            onChange={handleNewAccountChange}
          />
          {phoneAccError && (
            <Typography variant="body2" color="error">
              {phoneAccError}
            </Typography>
          )}
          <TextField
            margin="dense"
            name="email"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newAccountData.email}
            onChange={handleNewAccountChange}
          />
          {emailAccError && (
            <Typography variant="body2" color="error">
              {emailAccError}
            </Typography>
          )}
          <TextField
            margin="dense"
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={newAccountData.password}
            onChange={handleNewAccountChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {passwordAccError && (
            <Typography variant="body2" color="error">
              {passwordAccError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ marginRight: 2 }}>
          <Button
            onClick={handleModalClose}
            sx={{
              backgroundColor: "white",
              color: "#29AAE1",
              "&:hover": {
                backgroundColor: "#29AAE1",
                color: "white",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateAccount}
            sx={{
              backgroundColor: "#29AAE1",
              color: "white",
              "&:hover": {
                backgroundColor: "white",
                color: "#29AAE1",
              },
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
