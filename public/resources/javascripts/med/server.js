/**
 * Created by kanuny on 25.09.14.
 */
(function () {

    'use strict';

    var xhr = function (options) {
        var type = options.responseType || 'json';

        options.headers = options.headers || {};
        options.responseType = 'text';
        options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';

        return getXhrPromise(type, options);
    };
    var authXHR = function (options) {
        var type = options.responseType || 'json';

        options.headers = options.headers || {};
        options.responseType = 'text';
        options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
        if (WinJS.Application.sessionState.token) {
            options.headers.Authorization = 'Bearer ' + WinJS.Application.sessionState.token;
        }
        return getXhrPromise(type, options);
    };
    function showError(el, msg) {
        var errmsg = '✗ Error: ' + msg,
            errdiv = '<div class="b-edit-user__error">' + errmsg + '</div>',
            prstErrs = WinJS.Utilities.query('.b-edit-user__error', el);
        var isPrst = WinJS.Utilities.query('.b-edit-user__error', el).some(function (err) {
            return err.innerHTML == errmsg;
        });

        if (isPrst) return;
        WinJS.Utilities.insertAdjacentHTML(el, 'beforeend', errdiv);
    }
    function isUnique(key, value, cb, err) {
        var data = JSON.stringify({
            key: key,
            value: value
        });
        MED.Server.authXHR({
            url: '/api/users/isUnique',
            type: 'POST',
            data: data
        }).done(
            function (res) {
                if (cb && typeof(cb) === 'function') {
                    cb(res);
                }
            },
            function (error) {
                if (err && typeof(err) === 'function') {
                    err(error);
                }
            }
        );
    }
    var params = {
            email: {
                re: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                unique: true
            },
            name: {
                required: true,
                unique: true
            },
            login: {
                required: true,
                unique: true
            },
            password: {
                required: true
            },
            phone: {
                re: /\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/,
                unique: false
            }
        },
        errMsgs = {
            format : 'wrong format',
            required : 'required',
            taken : 'already taken'
        };
    var userVal = function (field) {
        var errs = WinJS.Utilities.query('.b-edit-user__error', field.parentNode);
        errs.forEach(function (err) {
            field.parentNode.removeChild(err);
        });
        if (field.value == '') {
            return;
        }
        for (var key in params[field.name]) {
            switch (key){
                case 're':
                    if (!params[field.name].re.test(field.value)) {
                        showError(field.parentNode, errMsgs.format);
                    }
                    break
                case 'unique':
                    if (params[field.name].unique) {
                        isUnique(field.name, field.value, function (res) {
                            if (!res.unique) {
                                showError(field.parentNode, errMsgs.taken);
                            }
                        })
                    }
                    break
            }
        }
    };
    function getXhrPromise (type, options) {
        return new WinJS.Promise(
            function (c, e, p) {
                var callback = function (req) {
                    var response;
                    if (type === 'json') {
                        response = JSON.parse(req.responseText)
                    } else {
                        response = req.responseText;
                    }
                    if (c && typeof(c) === 'function') {
                        c({
                            response: response,
                            status: req.status,
                            statusText: req.statusText,
                            responseType: type,
                            readyState: req.readyState
                        });
                    }
                };
                WinJS.xhr(options).done(callback, e, p);
            }
        );
    }
    WinJS.Namespace.define("MED.Server", {
        xhr: xhr,
        authXHR: authXHR,
        userValidation: userVal
    });

    WinJS.UI.processAll();
})();