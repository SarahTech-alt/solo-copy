import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import './EditLog.css';
import { readAndCompressImage } from 'browser-image-resizer';
import moment from 'moment';

function EditLog() {

    const imageConfig = {
        quality: 1.0,
        maxHeight: 300,
    };

    // hooks for image actions
    const [preview, setPreview] = useState('');
    const [selectedFile, setSelectedFile] = useState('');
    const [resizedFile, setResizedFile] = useState('');
    const [changePicture, setChangePicture] = useState(false);

    // matches parameters of current route
    const allParams = useParams();

    // selects the id from the parameters
    const logId = allParams.id;

    // select the logDetail from the combined logHistory reducer
    const wholeStore = useSelector(store => store)
    const logInfo = useSelector(store => store.logHistory);
    const selectedLog = logInfo.logDetail;

    // access the logHistory reducer from the store
    const userInfo = useSelector(store => store.user);

    // getting user id from the store to send 
    // with uploaded photo
    const userId = userInfo.id;

    // variable for dispatching actions to sagas
    const dispatch = useDispatch();

    // variable for navigation purposes
    const history = useHistory();

    // on page load dispatch to selected log saga
    // send logId that was retried with useParams
    useEffect(() => {
        console.log('process env', process.env)
        dispatch({ type: 'SET_SELECTED_LOG', payload: logId });
        console.log('log id on page load', logId);
        dispatch({ type: 'SET_SELECTED_MUSHROOM_PHOTO', payload: logId })
    }, [logId]);



    const onFileChange = async (event) => {
        console.log(event);
        const userFile = event.target.files[0];
        // const acceptedImageTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/jpg'];
        // if (acceptedImageTypes.includes(acceptedImageTypes.type)) {
        const copyFile = new Blob([userFile], { type: userFile.type });
        const resizedFile = await readAndCompressImage(copyFile, imageConfig);
        setSelectedFile(userFile);
        setResizedFile(resizedFile);
        setPreview(URL.createObjectURL(resizedFile));
        console.log(process.env.REACT_APP_AWS_S3_BUCKET);
        selectedLog.mushroom_picture_thumb = `https://solospikebucket.s3.us-east-2.amazonaws.com/photos/thumb/${userFile.name}`; 
        selectedLog.mushroom_picture_medium = `https://solospikebucket.s3.us-east-2.amazonaws.com/photos/medium/${userFile.name}`;

    }

    const sendFormDataToServer = () => {
        // The file name seems to be dropped on resize, send both the
        // original and resized files.
        let action;
        console.log('in send form data to server', logInfo);
        dispatch({
            type: 'EDIT_LOG_DETAILS',
            payload: {
                // any other form data...
                logId,
                logInfo,
                resizedFile,
                selectedFile
            }
        })
        sendPictureToServer();
    }

    const sendPictureToServer = () => {
        console.log('in send picture to server on edit page');
        let action;
        action = {
            type: 'ADD_MUSHROOM_PHOTO',
            payload: {
                selectedFile,
                resizedFile,
                logId
            }
        }
        setPreview('');
        setChangePicture(!changePicture);
        history.goBack();
    }
    // dispatches to delete saga on delete button click
    const deleteLog = () => {
        console.log('in delete log on component',logId);
        dispatch({ type: 'DELETE_SELECTED_LOG', payload: logId })
        history.goBack();
    }

    return (
        <>
            {JSON.stringify(selectedLog)}<hr />
            {/* Access information from the logDetail
            reducer and display on DOM with buttons to edit logs
            and a back button to navigate to previous page */}
            <h1>Edit Page</h1>
            <button onClick={event => deleteLog()}>delete log </button>
            <br /><br />
            <input
                type="text"
                onChange={event => ({ ...selectedLog.common_name = event.target.value })}
                placeholder={selectedLog.common_name}
            />
            <br />
            <input
                type="text"
                onChange={event => ({ ...selectedLog.scientific_name = event.target.value })}
                placeholder={selectedLog.scientific_name}
            />
            <br />
            <input
                type="text"
                onChange={event => ({ ...selectedLog.latitude = event.target.value })}
                placeholder={selectedLog.latitude}
            /><br />
            <input
                type="text"
                onChange={event => ({ ...selectedLog.longitude = event.target.value })}
                placeholder= {selectedLog.longitude}
            /><br />
            <input
                type="text"
                onChange={event => ({ ...selectedLog.details = event.target.value })} placeholder={selectedLog.details} /><br />
            <input
                type="date"
                value={moment().format('MMMM Do YYYY, h:mm:ss a')}
                onChange={event => ({ ...selectedLog.date = event.target.value })}
                onfocus={selectedLog.date}
            /><br />
            <img
                src={selectedLog.mushroom_picture_medium}
                alt={selectedLog.common_name}
                onClick={(event => setChangePicture(!changePicture))}
            />
            {/* display preview of image once selected
        onFileChange sets the state of preview */}
            {preview && (
                <img
                    className="placeholder-photo-preview"
                    src={preview}
                    alt="Photo preview"
                />
            )}
            {/* Show file upload when the user clicks their profile picture
            Allows user to select a file from their local files */}
            {changePicture && (
                <div>
                    <input type="file" accept="image/*" onChange={onFileChange} />
                    {/* Dispatches file to saga when the button is clicked */}
                </div>
            )}

            <br /> <br />
            <button onClick={event => sendFormDataToServer()}>Submit</button>
            <br /><br />

            {/* <button onClick={event => setEditThing(!editThing)}>Edit</button> */}
            <button onClick={event => history.goBack()}>back</button>
        </>
    );
}

export default EditLog;