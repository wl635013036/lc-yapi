import React, { Component } from 'react'

/**
 *
 * @param options
 */
module.exports = function (options) {

    const gitLablogin = () => {
        const { ssoUri, appId } = options;
        location.href = ssoUri + appId;
    }

    const GitLabComponent = () => (
        <button onClick={gitLablogin} className="btn-home btn-home-normal" >知音楼登录</button>
    )

    this.bindHook('third_login', GitLabComponent);
};






