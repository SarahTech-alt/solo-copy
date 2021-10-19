const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();
require('dotenv').config();
const aws = require('aws-sdk');
const {
    rejectUnauthenticated,
} = require('../modules/authentication-middleware');

const { AWS_S3_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
aws.config.region = AWS_S3_REGION;

/**
 * @api {post} /s3 Upload Photo
 * @apiPermission user
 * @apiName PostPhoto
 * @apiGroup Photo
 * @apiDescription This route uploads a photo.
 *
 * @apiParam {String} name              Mandatory image file name.
 * @apiParam {String} type              Mandatory image file type.
 * @apiParam {String} size              Mandatory image file size.
 * @apiParam {File}   image             Mandatory image
 *
 * @apiSuccessExample {json} Success-Response:
 *      HTTP/1.1 201 OK
 */

router.get('/detail/:id', (req, res) => {
    const selectedId = Number(req.params.id);
    console.log('selected log id in router', selectedId);
    const userId = req.user.id;
    console.log('user id in router', req.user.id)
    queryText = `SELECT "log_entry"."id","user_id","date","latitude","longitude","details","common_name","scientific_name", "mushroom_picture_thumb", "mushroom_picture_medium" FROM "log_entry" LEFT JOIN
    "mushroom_junction" ON "mushroom_junction"."log_id" = "log_entry"."id"
    LEFT JOIN "mushroom_pictures" ON "mushroom_junction"."mushroom_picture_id" = "mushroom_pictures"."id"
    LEFT JOIN "mushroom_names" ON "mushroom_junction"."mushroom_picture_id" = "mushroom_pictures"."id" WHERE "log_entry"
    ."id"=$1 AND "user_id" =$2;`
    pool.query(queryText, [selectedId, userId])
        .then(results => {
            console.log('sending back id details', results.rows);
            res.send(results.rows)
        })
        .catch(error => {
            console.log('there was an error getting details', error);
            res.sendStatus(500);
        })
})

router.delete('/delete/:id', (req, res) => {
    // console.log('REQ in delete', req);
    // console.log('req.params in delete', req.params);
    console.log('in delete', req.params.id)
    const logId = req.params.id;
    console.log('id in first query', logId)
    const getIdsQuery = 'SELECT * FROM "mushroom_junction" where "log_id"=$1'
    // const deleteFromPictures = `DELETE FROM mushroom_pictures WHERE "log_entry_id" = $1;`
    pool.query(getIdsQuery, [logId])
        .then(result => {
            console.log('result from getting ids in db',result.rows);
            const fetchedIds = result.rows[0];
            console.log('fetched ids', fetchedIds);
            
            const mushroomNamesId = fetchedIds.mushroom_names_id;
            const mushroomPictureId = fetchedIds.mushroom_picture_id;
            const deleteFromJunction = `DELETE FROM "mushroom_junction" WHERE "log_id"=$1;`
            pool.query(deleteFromJunction,[logId])
            .then(result=> {

            const queryText = `DELETE FROM log_entry WHERE "id" = $1;`;
            pool.query(queryText, [logId])


                .then(result => {
                    console.log(result.rows)
                    const deleteFromNames = `DELETE FROM mushroom_names WHERE "id" = $1;`
                    pool.query(deleteFromNames, [mushroomNamesId])


                        .then(result => {  
                            const deleteFromPictures = `DELETE FROM mushroom_pictures WHERE "id" = $1;`
                            pool.query(deleteFromPictures, [mushroomPictureId])
                            .then(result => {
                                console.log('success in deleting')
                                res.sendStatus(200)})
                                .catch(error => {
                                     console.log('there was an error deleting pictures', error)
                                })
                        .catch(error => {
                            console.log('there was an error deleting mushroom pictures', error)
                        })
                })
        })
        .catch(error => {
            console.log('there was an error deleting names', error)
        })
        .catch(error => {
            console.log('there was an error deleting log entry', error)
        })
        .catch(error => {
            console.log('there was an error deleting log', error)})
            })
})
})

router.post('/', (req, res) => {
    const mushroomData = req.body.details;
    const fileName = req.body.fileName;
    console.log(req.body);
    console.log('info in router post', mushroomData);
    console.log('url in router post', fileName);
    // RETURNING "id" will give us back the id of the created log
    const insertLogInfo = `
    INSERT INTO "log_entry" ("date", "latitude", "longitude", "details")
    VALUES ($1, $2, $3, $4)
    RETURNING "id";`
    // FIRST QUERY MAKES LOG ENTRY
    pool.query(insertLogInfo, [mushroomData.date, mushroomData.latitude, mushroomData.longitude, mushroomData.details])
        .then(result => {
            console.log('New Log Id:', result.rows[0].id); //ID IS HERE!
            const createdLogId = result.rows[0].id
            // Now handle the genre reference
            const insertMushroomNames = `
        INSERT INTO "mushroom_names" ("common_name", "scientific_name")
        VALUES  ($1, $2)
        RETURNING "id";
        `
            // SECOND QUERY ADDS NAMES
            pool.query(insertMushroomNames, [mushroomData.common_name, mushroomData.scientific_name])

                .then(result => {
                    const createMushroomNameId = result.rows[0].id;
                    console.log('second url in post', createMushroomNameId);

                    const mediumUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com/photos/medium/${fileName}`;
                    const thumbUrl = `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com/photos/thumb/${fileName}`;
                    const insertPicture = `INSERT INTO "mushroom_pictures" ("mushroom_picture_thumb","mushroom_picture_medium") VALUES ($1,$2) RETURNING "id";`
                    pool.query(insertPicture, [thumbUrl, mediumUrl])

                        .then((result => {
                            const createPhotoId = result.rows[0].id;
                            console.log('the photo id in router is', createPhotoId)
                            const insertIntoJunction = `INSERT INTO "mushroom_junction" ("log_id","mushroom_names_id", "user_id", "mushroom_picture_id") VALUES ($1,$2,$3,$4);`;
                            pool.query(insertIntoJunction, [createdLogId, createMushroomNameId, req.user.id, createPhotoId])
                                .then(result => {
                                    res.sendStatus(200);
                                })
                        }))
                })
        }).catch(error => {
            console.log('there was an error posting log', error);
        })
        .catch(err => {
            // catch for second query
            console.log(err);
            res.sendStatus(500)
        }).catch(err => {
            res.sendStatus(500)
        })
        // Catch for first query
        .catch(err => {
            console.log(err);
            res.sendStatus(500)
        })
})

router.get('/', (req, res) => {
    const userId = req.user.id;
    const queryText = `SELECT "log_id", "user_id","date","details" "latitude","longitude", "common_name", "scientific_name","details", "mushroom_picture_thumb", "mushroom_picture_medium" FROM "log_entry" 
    JOIN "mushroom_junction" ON  "mushroom_junction"."log_id"="log_entry"."id"
    JOIN "mushroom_names" ON "mushroom_junction"."mushroom_names_id"="mushroom_names"."id" 
    JOIN "mushroom_pictures" ON "mushroom_junction"."mushroom_picture_id"="mushroom_pictures"."id"
    WHERE "user_id"=$1;`;
    pool.query(queryText, [userId])
        .then(results => {
            console.log('results.rows in get router', results.rows)
            res.send(results.rows)
        })
        .catch(error => {
            console.log('there was an error getting the logs', error);
            res.sendStatus(500);
        })
})


router.put('/editInfo/:id', (req, res) => {
    console.log('req.params in update log', req.params)
    console.log('req.body in edit router', req.body)
    let mushroomInfo = req.body;
    const userId = req.user.id;
    const logId = req.params.id;
    queryText = `UPDATE log_entry SET ("date", "details") = ($1,$2) WHERE "id" = $3;`;
    pool.query(queryText, [mushroomInfo.date, mushroomInfo.details, logId])
        .then(result => {
            // sends success status on completion
            res.sendStatus(200)
        }).catch(error => {
            // sends error status on error
            console.log('there was an error posting edited info', error);
            res.sendStatus(500);
        })
})

module.exports = router;