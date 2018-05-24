/**
 * Created by Haimov on 15/03/2018.
 */

let userContext = `user`,
    communityContext = `community`,
    activityContext = `activity`,
    notificationContext = `notification`,
    messageContext = `message`,
    port = 4300;

module.exports = {
    BASE_URL:`localhost:${port}`,
    user: {
        USER_KEY: `xmDN30sOAqgngu79CkEom1i2ZGD3`,
        USER_NAME:`Binder Test`,
        USER_EMAIL:`binderTestUser@mailinator.com`,
        USER_PASS:`Aa123456`,
        TOKEN:``
    },
    http_codes: {
        STATUS_OK:200,
        NOT_RESPONDING: 502,
        NOT_FOUND: 404,
        UNAUTHORIZED: 401
    },
    server_uri: {
        community: {
            create: `/${communityContext}/create`,
            leave: `/${communityContext}/leave`,
            join: `/${communityContext}/join`,
            delete: `/${communityContext}/delete`,
            members: `/${communityContext}/members`,
            get: `/${communityContext}/get/:key`,
            search: `/${communityContext}/search/:query`,
            add_waiting_list: `/${communityContext}/add-waiting-list`,
            remove_waiting_list: `/${communityContext}/remove-waiting-list`,
        },
        user: {
            create: `/${userContext}/create`,
            update: `/${userContext}/update`,
            delete: `/${userContext}/delete/:key`,
            vote: `/${userContext}/vote`,
            get: `/${userContext}/get/:key`,
            search: `$/{userContext}/search/:query`,
        },
        activity: {
            create: `/${activityContext}/create`,
            update: `/${activityContext}/update`,
            delete: `/${activityContext}/delete`,
            claim: `/${activityContext}/claim`,
            approve: `/${activityContext}/approve`,
            decline: `/${activityContext}/decline`,
            user_get: `/${activityContext}/user/get/:key`,
            community_get: `/${activityContext}/community`,
        },
        notification: {
            create: `/${notificationContext}/create`,
            update: `/${notificationContext}/update`,
            delete: `/${notificationContext}/delete`,
            get: `/${notificationContext}/get/:key`,
        },
        message: {
            create: `/${messageContext}/create`,
            get: `/${messageContext}/get/:roomId`,
            save_chat_room: `/${messageContext}/save-chat-room`,
        }
    }
};
