const request = require('request');
const controller = require('./controller/oauth2Controller');
const yapi = require('yapi.js');

module.exports = function (options) {
    this.bindHook('third_login', (ctx) => {
        let token = ctx.request.body.token || ctx.request.query.token;
        return new Promise((resolve, reject) => {
            const control = yapi.getInst(controller);
            control.getTicket(options).then(ticket => {
                if (typeof ticket !== 'string') {
                    reject(ticket)
                }
                const verifyUrl = options.ssoHost + '/api/v1/sso/verify?token=' + encodeURIComponent(token) + '&ticket=' + encodeURIComponent(ticket);

                request(verifyUrl, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        let result = JSON.parse(body);
                        if (result.errcode != 0) {
                            reject({ message: 'parse response failed for login: ' + result.errmsg})
                        }
                        let ret = {
                            email: result.data.email,
                            username: result.data.email.replace(new RegExp(options.emailPostfix + '$'), '')
                        };
                        resolve(ret);
                    }
                    reject({ message: 'unknown error, login failed! ' + (error || body) });
                });

            }).catch(err => {
                reject({ message: 'unknown error, login failed! ' + err})
            });
        });
    });

    this.bindHook('add_router', function(addRouter) {
        addRouter({
            controller: controller,
            method: 'get',
            path: 'yach/callback',
            action: 'oauth2Callback'
        });
    });
}