import React, { useState, useRef, useEffect } from "react";
import { useSelector } from 'react-redux';
import { Box, Typography, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import axios from "axios";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Alarms() {
  const [issueData, setIssueData] = useState({});
  const [alarmId, setAlarmId] = useState(null);
  const [alarmDetails, setAlarmDetails] = useState([]);
  const [open, setOpen] = useState(false);
  const [alarmName, setAlarmName] = useState('');
  const fileInputRefs = useRef({});
  const userInfo = useSelector((state) => state.user.userInfo);
  const [selectedAlarmId, setSelectedAlarmId] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const alarmsPerPage = 5;

  const handleAlarmSelect = (id) => {
    setSelectedAlarmId(id);
  };

  useEffect(() => {
    const fetchAlarmDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/get-alarm/${userInfo.id}`);
        const alarms = response.data.alarms;
        console.log("alarms", alarms);
        if (alarms) {
          // const url = process.env.VITE_API_URL;
          // const fileUrl = url?.split('api')
          setAlarmDetails(alarms);
          alarms.forEach(alarm => {
            setIssueData(prevData => ({
              ...prevData,
              [alarm.id]: {
                audioFile: null,
                previewUrl: alarm.audioFilename ? `https://emergency.nexusbox.io/uploads/audios/${alarm.audioFilename}` : null,
                preview: false,
                showPreviewButton: !!alarm.audioFilename
              }
            }));
          });
        }
      } catch (error) {
        console.error('Error fetching alarm details:', error);
      }
    };

    fetchAlarmDetails();
  }, [userInfo.id]);

  const handleFileChange = (event, alarmId) => {
    const file = event.target.files[0];
    if (file && alarmId) {
      const url = URL.createObjectURL(file);
      setIssueData(prevData => ({
        ...prevData,
        [alarmId]: { audioFile: file, previewUrl: url, preview: false, showPreviewButton: true }
      }));
      toast.success('You can preview or save the file');
      handleUpload(alarmId, file);
    }
  };

  const handleCreateAlarm = async () => {
    try {
      const { data } = await axios.post(`${API_URL}/create-alarm`, {
        alarmName: 'default',
        userId: userInfo.id
      });

      const newAlarmId = data.alarm.id;
      setAlarmId(newAlarmId);
      setOpen(false);
      setAlarmName('');

      const alarmDetailsResponse = await axios.get(`${API_URL}/get-alarm/${userInfo.id}`);
      setAlarmDetails(alarmDetailsResponse.data.alarms);
      setSelectedAlarmId(alarmDetailsResponse.data.alarms.id);
      toast.success('Alarm created successfully!');
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          toast.error(error.response.data.error || 'Bad Request');
        } else if (error.response.status === 500) {
          toast.error('Internal Server Error');
        } else {
          toast.error('An unexpected error occurred');
        }
      } else if (error.request) {
        toast.error('No response received from the server');
      } else {
        toast.error('Error creating alarm');
      }

      console.error('Error creating alarm:', error);
    }
  };

  const handleUploadClick = (issue) => {
    fileInputRefs.current[issue].click();
  };

  const handleUpload = async (alarmId, file) => {
    console.log('handleUpload called', alarmId);
    if (alarmId && userInfo.id) {
      const formData = new FormData();
      formData.append('audioFile', file); // Use the file directly
      formData.append('alarmId', alarmId);
      formData.append('userId', userInfo.id); // Add userId to formData

      try {
        const alarmDetailsResponse = await axios.post(`https://emergency.nexusbox.io/api/upload/${alarmId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('File uploaded successfully!');

        setAlarmDetails(alarmDetailsResponse.data.alarms);

        // Update the preview state after successful upload
        setIssueData(prevData => ({
          ...prevData,
          [alarmId]: {
            ...prevData[alarmId],
            preview: true,
            showPreviewButton: true,
          },
        }));
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error uploading file';
        console.error('Error uploading file:', error);
        toast.error(errorMessage);
      }
    }
  };


  const handleDeleteAlarm = async (alarmId) => {
    console.log('handleDeleteAlarm called', alarmId);

    if (alarmId && userInfo.id) {
      try {
        // Send DELETE request to remove the alarm
        const alarmDetailsResponse = await axios.delete(`https://emergency.nexusbox.io/api/alarm/${alarmId}`, {
          data: {
            userId: userInfo.id, // Send userId in the body of the request
          },
        });

        setAlarmDetails(alarmDetailsResponse.data.alarms);


        toast.success('Alarm deleted successfully!');

        // Update the issueData state after successful deletion
        setIssueData(prevData => {
          const newData = { ...prevData };
          delete newData[alarmId]; // Remove the deleted alarm from the state
          return newData;
        });
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error deleting alarm';
        console.error('Error deleting alarm:', error);
        toast.error(errorMessage);
      }
    }
  };



  const handlePreview = (issue) => {
    setIssueData(prevData => ({
      ...prevData,
      [issue]: { ...prevData[issue], preview: !prevData[issue].preview }
    }));
    if (issueData[issue]?.previewUrl && !issueData[issue]?.preview) {
      const audio = new Audio(issueData[issue].previewUrl);
      audio.play();
    }
  };

  // Get alarms for current page
  const indexOfLastAlarm = currentPage * alarmsPerPage;
  const indexOfFirstAlarm = indexOfLastAlarm - alarmsPerPage;
  const currentAlarms = alarmDetails.slice(indexOfFirstAlarm, indexOfLastAlarm);

  // Handle page change
  const handlePageChange = (direction) => {
    if (direction === 'next') {
      setCurrentPage(prevPage => Math.min(prevPage + 1, Math.ceil(alarmDetails.length / alarmsPerPage)));
    } else if (direction === 'prev') {
      setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
    }
  };

  return (
    <React.Fragment>
      <ToastContainer />

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
                  d="M18.4672 17.1767L19.391 17.5594V17.5594L18.4672 17.1767ZM14.6788 20.9651L15.0615 21.889H15.0615L14.6788 20.9651ZM9.32122 20.9651L8.93853 21.889L8.93853 21.889L9.32122 20.9651ZM7.05025 19.4477L7.75736 18.7406H7.75736L7.05025 19.4477ZM5.53284 17.1767L4.60896 17.5594L5.53284 17.1767ZM15.4118 6.56913L14.7707 5.80169L15.4118 6.56913ZM15.588 6.56902L16.2292 5.80161L15.588 6.56902ZM13.1087 9.03581L12.1614 9.35607L13.1087 9.03581ZM13.3939 9.0622L14.2624 9.55797L13.3939 9.0622ZM9.80918 3.58468L9.14384 2.83814L9.80918 3.58468ZM10.0029 3.59598L9.27072 4.2771L10.0029 3.59598ZM9.14384 2.83814C8.38115 3.51787 4 7.70409 4 14.4979H6C6 8.57661 9.84251 4.89448 10.4745 4.33121L9.14384 2.83814ZM14.0561 8.71556C12.9477 5.437 11.2024 3.41721 10.7351 2.91487L9.27072 4.2771C9.62017 4.65275 11.1734 6.43362 12.1614 9.35607L14.0561 8.71556ZM14.2624 9.55797C14.9998 8.26614 15.8298 7.52294 16.0529 7.33657L14.7707 5.80169C14.4255 6.09006 13.4146 7.00891 12.5255 8.56642L14.2624 9.55797ZM14.9469 7.33644C15.3898 7.70649 18 10.0761 18 14.4391H20C20 9.21649 16.8719 6.33861 16.2292 5.80161L14.9469 7.33644ZM18 14.4391V14.4979H20V14.4391H18ZM18 14.4979C18 15.2859 17.8448 16.0661 17.5433 16.794L19.391 17.5594C19.7931 16.5888 20 15.5485 20 14.4979H18ZM17.5433 16.794C17.2417 17.522 16.7998 18.1834 16.2426 18.7406L17.6569 20.1548C18.3997 19.4119 18.989 18.53 19.391 17.5594L17.5433 16.794ZM16.2426 18.7406C15.6855 19.2977 15.0241 19.7397 14.2961 20.0412L15.0615 21.889C16.0321 21.4869 16.914 20.8977 17.6569 20.1548L16.2426 18.7406ZM14.2961 20.0412C13.5681 20.3428 12.7879 20.4979 12 20.4979V22.4979C13.0506 22.4979 14.0909 22.291 15.0615 21.889L14.2961 20.0412ZM12 20.4979C11.2121 20.4979 10.4319 20.3428 9.7039 20.0412L8.93853 21.889C9.90914 22.291 10.9494 22.4979 12 22.4979V20.4979ZM9.7039 20.0412C8.97595 19.7397 8.31451 19.2977 7.75736 18.7406L6.34314 20.1548C7.08601 20.8977 7.96793 21.4869 8.93853 21.889L9.7039 20.0412ZM7.75736 18.7406C7.20021 18.1834 6.75825 17.522 6.45672 16.794L4.60896 17.5594C5.011 18.53 5.60028 19.4119 6.34315 20.1548L7.75736 18.7406ZM6.45672 16.794C6.15519 16.0661 6 15.2859 6 14.4979H4C4 15.5485 4.20693 16.5888 4.60896 17.5594L6.45672 16.794ZM16.0529 7.33657C15.7344 7.60266 15.2677 7.60448 14.9469 7.33644L16.2292 5.80161C15.8053 5.4475 15.1922 5.44954 14.7707 5.80169L16.0529 7.33657ZM12.1614 9.35607C12.4857 10.3153 13.7768 10.4085 14.2624 9.55797L12.5255 8.56642C12.8788 7.94756 13.8172 8.00911 14.0561 8.71556L12.1614 9.35607ZM10.4745 4.33121C10.1037 4.66169 9.56813 4.5968 9.27072 4.2771L10.7351 2.91487C10.3327 2.48233 9.62969 2.40513 9.14384 2.83814L10.4745 4.33121Z"
                  fill="#ffff"
                />
                <path
                  d="M11.4581 11.9082L10.8311 11.1292V11.1292L11.4581 11.9082ZM8.04628 16.8824L7.05717 16.7352H7.05717L8.04628 16.8824ZM12.5421 11.9082L13.169 11.1292L12.5421 11.9082ZM15.9537 16.8824L14.9646 17.0296L14.9646 17.0296L15.9537 16.8824ZM15.958 16.9165L14.9634 17.0204C14.9648 17.0338 14.9665 17.0472 14.9685 17.0606L15.958 16.9165ZM8.04197 16.9165L9.03153 17.0606C9.03347 17.0472 9.03515 17.0338 9.03655 17.0204L8.04197 16.9165ZM10.8311 11.1292C10.2968 11.5591 9.46733 12.291 8.71968 13.2298C7.97947 14.1592 7.26126 15.3639 7.05717 16.7352L9.03538 17.0296C9.16671 16.1472 9.65301 15.2682 10.2842 14.4758C10.9078 13.6926 11.6165 13.0643 12.085 12.6873L10.8311 11.1292ZM13.169 11.1292C12.4825 10.5767 11.5176 10.5767 10.8311 11.1292L12.085 12.6873C12.067 12.7018 12.0365 12.7148 12.0001 12.7148C11.9636 12.7148 11.9331 12.7018 11.9151 12.6873L13.169 11.1292ZM16.9428 16.7352C16.7387 15.3639 16.0206 14.1592 15.2804 13.2298C14.5328 12.291 13.7033 11.5592 13.169 11.1292L11.9151 12.6873C12.3836 13.0643 13.0922 13.6926 13.7159 14.4757C14.347 15.2682 14.8333 16.1472 14.9646 17.0296L16.9428 16.7352ZM16.9526 16.8126C16.9499 16.7868 16.9467 16.761 16.9428 16.7352L14.9646 17.0296C14.9642 17.0266 14.9638 17.0235 14.9634 17.0204L16.9526 16.8126ZM14.9685 17.0606C14.9892 17.2029 15 17.3489 15 17.498H17C17 17.2521 16.9822 17.0098 16.9476 16.7724L14.9685 17.0606ZM15 17.498C15 19.1549 13.6569 20.498 12 20.498V22.498C14.7614 22.498 17 20.2594 17 17.498H15ZM12 20.498C10.3431 20.498 9 19.1549 9 17.498H7C7 20.2594 9.23858 22.498 12 22.498V20.498ZM9 17.498C9 17.3489 9.01081 17.2029 9.03153 17.0606L7.05241 16.7723C7.01783 17.0098 7 17.2521 7 17.498H9ZM7.05717 16.7352C7.05334 16.761 7.05008 16.7868 7.04738 16.8125L9.03655 17.0204C9.03623 17.0235 9.03583 17.0266 9.03538 17.0296L7.05717 16.7352Z"
                  fill="#ffff"
                />
              </svg>
            </Box>
            <Typography component="h1" variant="h1">
              Alarms
            </Typography>
          </Box>
          <Box className="head_butn">
            <Button
              className="common_buttn-desgn"
              onClick={handleCreateAlarm}
            >
              New Alarm
            </Button>
          </Box>
        </Box>
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Alarm</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Alarm Name"
            type="text"
            fullWidth
            variant="standard"
            value={alarmName}
            onChange={(e) => setAlarmName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAlarm}>Create</Button>
        </DialogActions>
      </Dialog>

      <Box className="page_content">
        <Box className="page_table">
          <Box className="table_title">
            <Typography variant="h2" component="h2">
              Alarm Settings
            </Typography>
            <Box className="navigation">
              <Button className="navig_buttn" onClick={() => handlePageChange('prev')} disabled={currentPage === 1}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.75 21.25L7.5 15L13.75 8.75" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22.5 21.25L16.25 15L22.5 8.75" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
              <Button className="navig_buttn" onClick={() => handlePageChange('next')} disabled={currentPage === Math.ceil(alarmDetails.length / alarmsPerPage)}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.25 21.25L22.5 15L16.25 8.75" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7.5 21.25L13.75 15L7.5 8.75" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            </Box>
          </Box>
          <Box className="issue_types">
            {currentAlarms.length > 0 && currentAlarms.map((alarm) => (
              <Box className="single_issue" key={alarm.id} onClick={() => handleAlarmSelect(alarm.id)}>
                <Box className="issue_heading">
                  <Typography component="h3" variant="h3">
                    {alarm.alarmName || 'Alarm Issue'}
                  </Typography>
                </Box>
                <Box className="issue_actions">
                  <Box className="label">
                    <Typography component="h4" variant="h4">
                      {alarm?.toneName}
                    </Typography>
                  </Box>
                  <Box className="issue_act_btns">
                    <Box className="actions left">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(event) => handleFileChange(event, alarm.id)}
                        style={{ display: "none" }}
                        ref={ref => fileInputRefs.current[alarm.id] = ref}
                      />
                      {issueData[alarm.id]?.showPreviewButton && (
                        <Button
                          className="act_btn white_bg"
                          onClick={() => handlePreview(alarm.id)}
                          disabled={!issueData[alarm.id]?.previewUrl}
                        >
                          Preview
                        </Button>
                      )}
                      {!issueData[alarm.id]?.preview && (
                        <Button
                          className="act_btn outlined"
                          onClick={() => fileInputRefs.current[alarm.id]?.click()}
                        >
                          Upload
                        </Button>
                      )}
                    </Box>
                    {!issueData[alarm.id]?.preview && (
                      <Box className="actions right">
                        <Button
                          className="act_btn with_bg"
                          onClick={() => handleDeleteAlarm(alarm.id)} // Trigger upload for the specific alarm
                        // disabled={!issueData[alarm.id]?.audioFile} // Disable if no file is selected
                        >
                          Delete
                        </Button>
                      </Box>
                    )}
                    {issueData[alarm.id]?.preview && issueData[alarm.id]?.previewUrl && (
                      <Box>
                        <audio controls src={issueData[alarm.id].previewUrl} />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </React.Fragment>
  );
}
