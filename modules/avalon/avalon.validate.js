define(["avalon"], function(avalon) {

//在form元素上定义ms-validate="opts" //opts在VM中为一个不被监控的对象
    var avalonValidate = avalon.bindingHandlers.validate = function(data, vmodels) {
        avalon.parseExprProxy(data.value, vmodels, data)
    }

    var rcheckbox = /checkbox|radio/
    var rnovalidate = /submit|rest|file|image/
    //type="submit", type="reset", type="file", type="image"以及disabled的表单元素没有验证性可言，会跳过它们

    avalon.bindingExecutors.validate = function(opts, form, data) {
        opts = avalon.mix(true, {}, defaults, opts)
        form.setAttribute("novalidate", "novalidate")
        form.msValidate = function(el) {
            if (hasAttr(el, "required") && !rnovalidate.test(el.type) && !el.disabled) {
                if (!("msValidateTarget" in el)) {
                    var targetID = el.getAttribute("data-validate-target")
                    var target = targetID ? document.getElementById(targetID) :
                            (rcheckbox.test(el.type) ? getFirstSameNameElement(el) : el)
                    el.msValidateTarget = avalon(target || el)
                    el.msValidateTarget.vmodel = avalon.define("tip" + String(Math.random()).slice(4), function(vm) {
                        vm.toggle = true
                        vm.content = "tip"
                    })
                    form.msValidate.elements.push(el)
                    if (el.type === "password" && !el.id) {
                        el.id = "$" + String(Math.random()).slice(4)
                    }
                    if (/input|textarea/i.test(el.nodeName) && !rcheckbox.test(el.type)) {//除了checkbox, radio
                        avalon.bind(el, "blur", function(e) {
                            form.msValidate(el)
                        })
                    } else if (window.VBArray && rcheckbox.test(el.type)) {
                        avalon.bind(el, "click", function() {//旧式IE checkbox, radio 模拟标准浏览器的change事件
                            form.msValidate(el)
                        })
                    } else {
                        avalon.bind(el, "change", function(e) {//select
                            form.msValidate(el)
                        })
                    }
                } else {
                    var val = avalon(el).val()
                    var target = el.msValidateTarget
                    if (opts.errorTarget && opts.errorTarget == target) {
                        opts.errorTarget.removeClass(opts.ngClass)
                        opts.errorTarget = null
                    }
//确保不能为空
                    var ok = checkRule(el, val, "required", opts, target)
                    //确保控件值与类型相匹配
                    ok && (ok = checkRule(el, val, el.getAttribute("type") || el.type || "text", opts, target))
                    //根据pattern的正则表达式判断输入是否为合法格式
                    ok && (ok = checkRule(el, val, "pattern", opts, target))
                    
                    ok && (ok = checkRule(el, val, "maxlength", opts, target))
                 
                    ok && (ok = checkRule(el, val, "minlength", opts, target))
                    //   console.log(ok+"minlength")
                    var otherValidates = filterData(avalon(el).data(), "validate")
                    for (var ruleName in otherValidates) {
                        if (typeof opts.rules[ruleName] == "function") {
                            ok && (ok = checkRule(el, val, ruleName, opts, target))
                        }
                    }
                }

            } else {
                return true
            }
        }
        form.msValidate.ngClass = opts.ngClass
        form.msValidate.elements = []
        form.msValidate.isAllPass = function() {
            var els = this.elements;
            var validate = this
            for (var i = 0, el; el = els[i++]; ) {
                validate(el)
                if (avalon(el.msValidateTarget).hasClass(validate.ngClass)) {
                    return false
                }
            }
            return true
        }
        var inputs = form.elements
        for (var i = 0, el; el = inputs[i++]; ) {
            if (!hasMsAttr(el)) {//处理没有被双工绑定的元素
                form.msValidate(el)
            }
        }
    }


    function checkRule(el, val, ruleName, options, target) {
//如果还没有出错
//        if (!options.errorTarget) {
        var rule = options.rules[ruleName]
        if (typeof rule === "function") {
            var ok = rule.call(el, val, options)
            switch (ok) {
                case true:
                    target.addClass(options.okClass)
                    target.vmodel.toggle = false
                    options.errorTarget = null
                    break
                case false:
                    target.removeClass(options.okClass)
                    target.addClass(options.ngClass)
                    options.errorTarget = target
                    showError(target, ruleName, options)
                    if (options.autofocus) {
                        setTimeout(function() {
                            el.focus();
                            el.select();
                        }, 0)
                    }
                    break
                default: 
                    return true
            }
            return ok
        }
        return true
    }

    function showError(target, ruleName, options) {
        var message = options.messages[ruleName] || "error"
        var vmodel = target.vmodel
        vmodel.toggle = true
        if (!target.tip) {
            vmodel.content = message
            avalonValidate.createTip(target, options)
        } else {
            vmodel.content = message
        }
    }

    /*********************************************************************
     *                      默认配置                                *
     **********************************************************************/
    var remail = /^(?:[a-z0-9]+[_\-+.]?)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i
    var rdate = /^([1-2]\d{3})([-/.])?(1[0-2]|0?[1-9])([-/.])?([1-2]\d|3[01]|0?[1-9])$/
    var rtel = /^(?:(?:0\d{2,3}[- ]?[1-9]\d{6,7})|(?:[48]00[- ]?[1-9]\d{6}))$/
    function returnTrue(){
        return true
    }
    var defaults = avalonValidate.defaults = {
        okClass: "avalon-valid",
        ngClass: "avalon-invalid",
        rules: {//验证函数
            required: function(val) {//不能为空
                if (/checkbox|radio|select/.test(this.type)) {
                    return
                }
                return val.length !== 0 && (this.type === "password" || /\S/.test(val))
            },
            email: function(val) {
                return remail.test(val)
            },
            // 仅支持 8 种类型的 day
            // 20120409 | 2012-04-09 | 2012/04/09 | 2012.04.09 | 以上各种无 0 的状况
            date: function(val) {
                var taste, d;
                if (!rdate.test(val))
                    return false
                taste = rdate.exec(val);
                var year = +taste[1], month = +taste[3] - 1, day = +taste[5]
                d = new Date(year, month, day)
                return year === d.getFullYear() && month === d.getMonth() && day === d.getDate()
            },
            // 手机：仅中国手机适应；以 1 开头，第二位是 3-9，并且总位数为 11 位数字
            mobile: function(text) {
                return /^1[3-9]\d{9}$/.test(text)
            },
            // 座机：仅中国座机支持；区号可有 3、4位数并且以 0 开头；电话号不以 0 开头，最 8 位数，最少 7 位数
            //  但 400/800 除头开外，适应电话，电话本身是 7 位数
            // 0755-29819991 | 0755 29819991 | 400-6927972 | 4006927927 | 800...
            tel: function(text) {
                return rtel.test(text)
            },
            number: function(val) {
                var min = +this.getAttribute('min')
                        , max = +this.getAttribute('max')
                        , result = /^\-?(?:[1-9]\d*|0)(?:[.]\d+)?$/.test(val)
                        , text = +val
                        , step = +getAttribute('step')
                isNaN(min) && (min = text - 1)
                isNaN(max) && (max = text + 1)
                // 目前的实现 step 不能小于 0
                return result && (isNaN(step) || 0 >= step ?
                        (text >= min && text <= max) : 0 === (text + min) % step && (text >= min && text <= max))
            },
            // 判断是否在 min / max 之间
            range: function(text) {
                return avalonValidate.defaults.number.call(this, text);
            },
            // 支持类型:
            // http(s)://(username:password@)(www.)domain.(com/co.uk)(/...)
            // (s)ftp://(username:password@)domain.com/...
            // git://(username:password@)domain.com/...
            // irc(6/s)://host:port/... // 需要测试
            // afp over TCP/IP: afp://[<user>@]<host>[:<port>][/[<path>]]
            // telnet://<user>:<password>@<host>[:<port>/]
            // smb://[<user>@]<host>[:<port>][/[<path>]][?<param1>=<value1>[;<param2>=<value2>]]
            url: (function() {
                var protocols = '((https?|s?ftp|irc[6s]?|git|afp|telnet|smb):\\/\\/)?'
                        , userInfo = '([a-z0-9]\\w*(\\:[\\S]+)?\\@)?'
                        , domain = '(?:[a-z0-9]+(?:\-[\w]+)*\.)*[a-z]{2,}'
                        , port = '(:\\d{1,5})?'
                        , ip = '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}'
                        , address = '(\\/\\S*)?'
                        , domainType = [protocols, userInfo, domain, port, address]
                        , ipType = [protocols, userInfo, ip, port, address]
                        , rdomainType = new RegExp('^' + domainType.join('') + '$', 'i')
                        , ripType = new RegExp('^' + ipType.join('') + '$', 'i')
                return function(text) {
                    return  rdomainType.test(text) || ripType.test(text);
                }
            })(),
            repeat: function(text, options) {//在密码与 重复输入密码这两个控件都定义data-validate-repeat="oppositeID",
                var oppositeID = this.getAttribute("data-validate-repeat")
                this.msHasRepeated = 1
                var oppositeEl = oppositeID && document.getElementById(oppositeID)
                if (oppositeEl && (oppositeEl.msHasRepeated || oppositeEl.className.indexOf(options.ngClass) !== -1)) {
                    return oppositeEl.value === text
                }
               
            },
            // 自定义
            password: returnTrue,
            text: returnTrue,
            select: returnTrue,
            zipcode: function(text) {
                return /^\d{6}$/.test(text)
            },
            // radio 根据当前 radio 的 name 属性获取元素，只要 name 相同的这几个元素中有一个 checked，则验证难过
            radio: function() {
                return multichotomous(this)
            },
            checkbox: function() {
                return multichotomous(this)
            },
            pattern: function(text) {
                var pattern = this.getAttribute('pattern')
                if (pattern) {
                    var reg = new RegExp('^(?:' + pattern + ')$')
                    return reg.test(text)
                }
            },
            maxlength: function(text) {
                var max = parseInt(this.getAttribute('maxlength'), 10)
                if (max > 0) {
                    return text.length <= max
                }
            },
            minlength: function(text) {
                var min = parseInt(this.getAttribute('minlength'), 10)
                if (min > 0) {
                    return text.length >= min
                }
            }
        },
        autofocus: false,
        arrowSize: 6, // 三角的尺寸
        arrowAlign: "center", //三角的位置，默认居中
        tipCSS: {
            maxWidth: 280,
            backgroundColor: "#FFFFE0",
            borderColor: "#F7CE39",
            color: "#333",
            fontSize: "12px",
            padding: "5px 10px",
            zIndex: 202,
            top: "99px",
            position: "absolute"
        },
        messages: {//出错时提示信息
            radio: "必须选择其中一项",
            checkbox: "必须选择其中一项",
            select: "请选择列表中的一项",
            email: "请输入电子邮件地址",
            url: "请输入网站地址",
            tel: "请输入手机号码",
            number: "请输入数值",
            date: "请输入日期",
            pattern: "内容格式不符合要求",
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/common-input-element-attributes.html#the-maxlength-and-minlength-attributes
            maxlength: "超出规定长度",
            minlength: "长度过短",
            repeat: "前后密码不一致",
            required: "请填写此字段",
            multiple: "多条数据使用逗号分隔"
        }
    }
    /*********************************************************************
     *                      辅助函数                                *
     **********************************************************************/
    var hasAttr = document.documentElement.hasAttribute ? function(el, attr) {
        return el.hasAttribute(attr)
    } : function(el, attr) {//IE67
        var outer = el.outerHTML, part = outer.slice(0, outer.search(/\/?['"]?>(?![^<]*<['"])/));
        return new RegExp("\\s" + attr + "\\b", "i").test(part);
    }
    var hasMsAttr = function(el) {
        var outer = el.outerHTML, part = outer.slice(0, outer.search(/\/?['"]?>(?![^<]*<['"])/));
        return new RegExp("\\sms-").test(part);
    }
    function filterData(obj, prefix) {
        var result = {}
        for (var i in obj) {
            if (i.indexOf(prefix) === 0) {
                result[i.replace(prefix, "").replace(/\w/, function(a) {
                    return a.toLowerCase()
                })] = obj[i]
            }
        }
        return result
    }
    function getFirstSameNameElement(target) {
        var name = target.name
        if (name) {
            var els = document.getElementsByName(name)
            return els[0]
        }
        return target
    }
    function multichotomous(target) {
        var name = target.name
        if (name) {
            var els = document.getElementsByName(name)
            for (var i = 0, el; el = els[i++]; ) {
                if (el.checked) {
                    return true
                }
            }
            return false
        }
    }
    var alignNumber = {
        center: "50%",
        left: "15%",
        right: "85%"
    }

    avalonValidate.createTip = function(target, options) {
        var element = target[0]
        var arrowTip = document.createElement("div")
        arrowTip.setAttribute("ms-visible", "toggle")
        var size = options.arrowSize
        var css = options.tipCSS

        arrowTip.innerHTML = "<div><b></b><b></b></div>{{content | html}}"
        document.body.appendChild(arrowTip)

        css.border = "1px solid " + css.borderColor

        var tip = avalon(arrowTip).css(css)

        avalon.scan(arrowTip, target.vmodel)
        // IE6 max-width的处理
        var maxWidth;
        if (!window.XMLHttpRequest && (maxWidth = parseInt(css.maxWidth)) && tip.width() > maxWidth) {
            tip.width(maxWidth);
        }
// 当前元素的位置，提示框的方向
        var offset = target.offset()
        var direction = "top"
        var tipTop = offset.top - arrowTip.offsetHeight - size
        if (tipTop < avalon(document).scrollTop()) {
            direction = "bottom";
            tipTop = offset.top + element.offsetHeight + size
        }
        target.tip = arrowTip
        options.direction = direction

        var align = alignNumber[options.align] || "50%";
        // 限高
        var cssOuterLimit = {
            width: 2 * size,
            left: align,
            marginLeft: (-1 * size) + "px",
            height: size,
            textIndent: 0,
            overflow: "hidden",
            position: "absolute"
        }
        if (direction == "top") {
            cssOuterLimit["bottom"] = -1 * size
        } else {
            cssOuterLimit["top"] = -1 * size
        }
        tip.css({
            left: offset.left,
            top: tipTop,
            // 因为三角位置造成的偏移
            marginLeft: element.offsetWidth * 0.5 - arrowTip.offsetWidth * parseInt(align) / 100
        })
        var arrowParent = arrowTip.firstChild
        avalon(arrowParent).css(cssOuterLimit)
        var arrows = arrowParent.getElementsByTagName("b")

        avalon(arrows[0]).css(createArrowCSS("before", options)) // before颜色为边框色
        avalon(arrows[1]).css(createArrowCSS("after", options))  // after为背景色

        if (!element.hasAttribute) {//fix IE67渲染BUG
            element.style.zoom = element.style.zoom
        }
    }
// 与方向无关的CSS
    var cssWithoutDirection = {
        width: 0,
        height: 0,
        overflow: "hidden",
        position: "absolute"
    }
// 创建三角
    var createArrowCSS = function(beforeOrAfter, params) {
// CSS名称值与变量，主要用来mini后节约文件大小
        var transparent = "transparent", dashed = "dashed", solid = "solid";
        // 方向由direction决定
        if (beforeOrAfter === "before") {
            cssWithDirection = {
                "top": {
                    borderColor: [params.tipCSS.borderColor, transparent, transparent, transparent].join(" "),
                    borderStyle: [solid, dashed, dashed, dashed].join(" "),
                    top: 0
                },
                "bottom": {
                    borderColor: [transparent, transparent, params.tipCSS.borderColor, ""].join(" "),
                    borderStyle: [dashed, dashed, solid, dashed].join(" "),
                    bottom: 0
                }
            }
        } else {
            cssWithDirection = {
                "top": {
                    borderColor: [params.tipCSS.backgroundColor, transparent, transparent, transparent].join(" "),
                    borderStyle: [solid, dashed, dashed, dashed].join(" "),
                    top: -1
                },
                "bottom": {
                    borderColor: [transparent, transparent, params.tipCSS.backgroundColor, ""].join(" "),
                    borderStyle: [dashed, dashed, solid, dashed].join(" "),
                    bottom: -1
                }
            };
        }
        return avalon.mix({
            borderWidth: params.arrowSize + "px"
        }, cssWithDirection[params.direction],
                cssWithoutDirection)
    }




    return avalon
})
//thanks to
// http://www.zhangxinxu.com/wordpress/2012/12/jquery-html5validate-html5-form-validate-plugin/
// https://github.com/sofish/validator.js
// https://github.com/dilvie/h5Validate/blob/master/jquery.h5validate.js