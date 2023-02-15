// const baseController = require('controllers/base.js');
const yapi = require('yapi.js');
const http = require('http')
const https = require("https")
const YachTicketModel = require('../yachTicketModel');

class oauth2Controller {
    constructor(ctx) {
        this.ctx = ctx;;
        this.Model = yapi.getInst(YachTicketModel);
    }

    async init(ctx) {
        this.$auth = true;
    }

    /**
     * oauth2 回调
     * @param ctx
     * @returns {Promise<void>}
     */
    async oauth2Callback(ctx) {
        try {
            // 获取code和state
            let token = ctx.request.query.token;
            if (!token) {
                return (ctx.body = yapi.commons.resReturn(null, 400, 'token不能为空'));
            }
            ctx.redirect('/api/user/login_by_token?token=' + token);

            return ctx.body = yapi.commons.resReturn(tokenResult, 401, "授权失败");
        } catch (err) {
            ctx.body = yapi.commons.resReturn(null, 400, err.message);
        }
    }

    getOptions(){
        for (let i = 0; i < yapi.WEBCONFIG.plugins.length; i++) {
            if (yapi.WEBCONFIG.plugins[i].name === 'yach') {
                return yapi.WEBCONFIG.plugins[i].options;
            }
        }
        return null;
    }

    async getTicket(ops) {
        let model = await this.Model.getTicket(ops.appId);
        if (!model || yapi.commons.time() - model.updated_at > ops.ticketTtl) {
            const getTicketUrl = '/basic/get_ticket?appid=' + ops.appId + '&appkey=' + encodeURIComponent(ops.appKey);
            let ticketOrErr = await this.requestInfo(ops, getTicketUrl, 'GET').then(function (res) {
                let jsonRes = JSON.parse(res);
                if (jsonRes.errcode != 0) {
                    return {
                        status_code: 401,
                        message: `get ticket failed: ${jsonRes.errmsg}(${jsonRes.errcode})`
                    }
                }
                return jsonRes.ticket
            }).catch(function (rej) {
                return {
                    status_code: rej.statuscode,
                    message: rej.statusMessage
                };
            });
            if (typeof ticketOrErr !== 'string') {
                return ticketOrErr
            }
            this.createOrUpdate(ops.appId, ticketOrErr)
            return ticketOrErr;
        } else {
            return model.ticket;
        }
    }

    async createOrUpdate(appId, ticket) {
        let model = await this.Model.getTicket(appId);
        let payload = {
            appId,
            ticket,
            updated_at: yapi.commons.time()
        };
        if (!model) {
            return await this.Model.save(payload);
        } else {
            return await this.Model.update(model._id, payload);
        }
    }

    requestInfo(ops, path, method) {
        if (ops.ssoHost.indexOf("https://") !== -1) {
            return new Promise((resolve, reject) => {
                let req = '';
                let httpsClient = https.request({
                    hostname: ops.ssoHost.replace("https://", ""),
                    path: path,
                    method: method
                }, function(res) {
                    res.on("error", function(err) {
                        reject(err);
                    });
                    res.setEncoding("utf8");
                    if (res.statusCode != 200) {
                        reject({statuscode: res.statusCode, statusMessage: res.statusMessage});
                    } else {
                        res.on("data", function(chunk) {
                            req += chunk;
                        });
                        res.on("end", function() {
                            resolve(req);
                        });
                    }
                });
                httpsClient.on("error", () => {
                    reject({message: "request error"});
                });
                httpsClient.end();
            });
        }

        return new Promise((resolve, reject) => {
            let req = "";
            let httpClient = http.request(ops.ssoHost + path,
                {
                    method,
                },
                function(res) {
                    res.on("error", function(err) {
                        reject(err);
                    });
                    res.setEncoding("utf8");
                    if (res.statusCode != 200) {
                        reject({statuscode: res.statusCode, statusMessage: res.statusMessage});
                    } else {
                        res.on("data", function(chunk) {
                            req += chunk;
                        });
                        res.on("end", function() {
                            resolve(req);
                        });
                    }
                }
            );
            httpClient.on("error", (e) => {
                reject({message: "request error"});
            });
            httpClient.end();
        });
    }
}

module.exports = oauth2Controller;
