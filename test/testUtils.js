/**
 * Created by Haimov on 15/03/2018.
 */

let userContext = 'user',
    communityContext = 'community',
    activityContext = 'activity',
    notificationContext = 'notification',
    messageContext = 'message';

module.exports = {
    USER_KEY: 'w9XFu8QKf1crshIpEbXOG1bYgnj2',
    USER_EMAIL:'test@test.com',
    USER_PASS:'Password1',
    BASE_URL:'localhost:4300',
    STATUS_OK:200,
    SERVER_URI: {
        community: {
            create: `${communityContext}/create`,
            leave: `${communityContext}/leave`,
            join: `${communityContext}/join`,
            delete: `${communityContext}/delete`,
            members: `${communityContext}/members`,
            get: `${communityContext}/get/:key`,
            update_role: `${communityContext}/update-role`,
            search: `${communityContext}/search/:query`,
            add_waiting_list: `${communityContext}/add-waiting-list`,
            remove_waiting_list: `${communityContext}/remove-waiting-list`,
        },
        user: {
            create: `${userContext}/create`,
            update: `${userContext}/update`,
            delete: `${userContext}/delete/:key`,
            vote: `${userContext}/vote`,
            get: `${userContext}/get/:key`,
            search: `${userContext}/search/:query`,
        },
        activity: {
            create: `${activityContext}/create`,
            update: `${activityContext}/update`,
            delete: `${activityContext}/delete`,
            claim: `${activityContext}/claim`,
            approve: `${activityContext}/approve`,
            decline: `${activityContext}/decline`,
            user_get: `${activityContext}/user/get/:key`,
            community_get: `${activityContext}/community`,
        },
        notification: {},
        message: {}
    }
};
