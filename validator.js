var Validator = (function(){

    var extend = function(a, b){
            for(var n in b){
                a[n] = b[n]
            }
            return a;
        },
        context = {},
        consts = context.Consts = {
            VALIDATOR:'validator',
            HAS_VALIDATOR:'hasValidator',
            ERROR_MSG:'__form_error'
        },
        rules = context.Rules = [],
        _getValue = function(target){
            return jQuery(target).val();
        },
        _setValue = function(target, val){
            return jQuery(target).val(val);
        },
        _tagName = function(target){
            return jQuery(target).get(0).tagName.toLowerCase();
        },
        _isCheckBox = function(target){
            return ((_tagName(target) === 'input') && (jQuery(target).attr('type') === 'checkbox'));
        },
        _isComboBox = function(target){
            return (_tagName(target) === 'select');
        },
        _isShow = function(target){
            var body = document.body;
            target = jQuery(target).get(0);
            while(target && target !== body){
                if(jQuery(target).css('display') === 'none'){
                    return false;
                }
                target = target.parentNode;
            }
            return true;
        },
        _isHide = function(target){
            return ( ! _isShow(target));
        };
    
    
    extend(context, {
        
        defaultLoad: function(pnl){
            
            pnl = pnl || document.body
            context.bind(jQuery(pnl));
            
            jQuery('form').submit(function(){
                
                jQuery('.' + consts.ERROR_MSG, this).remove();
                
                var check = context.run(this);
                
                if( ! check.valid){
                    var err;
                    for(var i=0,l=check.errors.length; i<l; ++i){
                        err = check.errors[i];
                        jQuery(err.target).parent().append(context.makeMessage(err.msg));
                    }
                    
                    var win = jQuery(window),
                        target = jQuery(check.errors[0].target),
                        windowH = win.height(),
                        targetTop = target.offset().top;
                    win.scrollTop(Math.max(0, targetTop - windowH / 2));
                    target.focus();
                }
                
                return check.valid;
                
            });
            
        },
        
        makeMessage: function(msg){
            return '<div class="' + consts.ERROR_MSG + '">' + msg + '</div>';
        },
        
        addRule: function(regex, parser){
            context.Rules.push({regex: regex, parser: parser});
        },
        
        bind: function(pnl){
            jQuery(':regex(class, ^__.+)', pnl).each(function(){
                
                var target = jQuery(this).get(0);
                
                jQuery.each(jQuery(target).attr('class').split(/\s+/), function(_, e){
                    for(var i = 0, l = rules.length; i < l; ++i){
                        if(e.match(rules[i].regex)){
                            rules[i].parser(target, e);
                            break;
                        }
                    }
                });
                
            });
        },
        
        run: function(pnl){
            var result = {valid:true, errors:[]};
            
            jQuery(':regex(data:' + consts.HAS_VALIDATOR + ', yes)', pnl).each(function(){
                if(_isShow(this)){
                    var errs = context.check(this);
                    if(errs){
                        result.valid = false;
                        result.errors = result.errors.concat(errs);
                    }
                }
            });
            
            return result;
        },
        
        check: function(target){
            var errors = [];
            var as = context.getActions(target);
            var a, r;
            for(var i=0,l=as.length; i<l; ++i){
                a = as[i];
                r = a();
                if(r){
                    errors.push({target:jQuery(target).get(0), msg:r});
                }
            }
            return (errors.length > 0) ? errors : null;
        },
        
        getActions: function(target){
            return (jQuery(target).data(consts.VALIDATOR)) ? jQuery(target).data(consts.VALIDATOR) : [];
        },
        
        addAction: function(target, a){
            var as = context.getActions(target);
            as.push(a);
            context.setActions(target, as);
        },
        
        setActions: function(target, as){
            jQuery(target).data(consts.HAS_VALIDATOR, 'yes');
            jQuery(target).data(consts.VALIDATOR, as);
        },
        
        removeActions: function(target){
            jQuery(target).data(consts.HAS_VALIDATOR, 'no');
            jQuery(target).data(consts.VALIDATOR, null);
        },
        
        
        setRegexpRule: function(target, regex, msg){
            context.addAction(target, function(){
                var val = _getValue(target);
                if(val.length === 0){ return null; }
                
                if( ! val.match(regex)){
                    return msg;
                }
                
                return null;
            });
        }
        
    });
    
    context.Messages = {
        REQUIRED_INPUT: function(){ return '入力してください。'; },
        REQUIRED_CHECK: function(){ return 'チェックしてください。'; },
        REQUIRED_SELECT: function(){ return '選択してください。'; },
        LENGTH_MIN: function(min){ return min + '文字以上で入力してください。'; },
        LENGTH_MAX: function(max){ return max + '文字以内で入力してください。'; },
        LENGTH_RANGE: function(min, max){ return min + '文字以上' + max + '文字以下で入力してください。'; },
        LENGTH: function(len){ return len + '文字で入力してください。'; },
        NUMBER_ONLY: function(){ return '半角数字のみで入力してください。'; },
        NUMBER: function(){ return '数値を入力してください。'; },
        INTEGER: function(){ return '整数を入力してください。'; },
        NUMBER_RANGE: function(min, max){ return min + '以上' + max + '以下の数値を入力してください。'; },
        ALPHABET: function(){ return 'アルファベットのみで入力してください。'; },
        ALPHABET_DASH: function(){ return '半角英数字およびハイフン・アンダースコアのみで入力してください。'; },
        HANKAKU: function(){ return '半角文字で入力してください。'; },
        ZENKAKU: function(){ return '全角文字で入力してください。'; },
        HIRAGANA: function(){ return 'ひらがなで入力してください。'; },
        KATAKANA: function(){ return '全角カタカナで入力してください。'; },
        HANKANA: function(){ return '半角カタカナで入力してください。'; },
        EMAIL: function(){ return '正しいメールアドレスの形式で入力してください。'; },
        URL: function(){ return '正しいURLの形式で入力してください。'; },
        PAIR: function(){ return '入力内容が異なります。'; }
    };
    
    var actions = context.Actions = {
        
        trim: function(target, ltrim, rtrim){
            context.addAction(target, function(){
                var val = _getValue(target);
                if(val.length === 0){ return null; }
                
                if(ltrim){
                    val = val.replace(/^[\n\r 　]+/g, '');
                }
                if(rtrim){
                    val = val.replace(/[\n\r 　]+$/g, '');
                }
                _setValue(target, val);
                
                return null;
            });
        },
        
        req: function(target){
            if(_isCheckBox(target)){
                context.addAction(target, function(){
                    if( ! jQuery(target).attr('checked')){
                        return context.Messages.REQUIRED_CHECK();
                    }
                    return null;
                });
            }else if(_isComboBox(target)){
                context.addAction(target, function(){
                    var val = _getValue(target);
                    if( ! val){
                        return context.Messages.REQUIRED_SELECT();
                    }
                    return null;
                });
            }else{
                context.addAction(target, function(){
                    var val = _getValue(target);
                    if(val.length === 0){
                        return context.Messages.REQUIRED_INPUT();
                    }
                    return null;
                });
            }
        },
        
        min: function(target, min){
            context.addAction(target, function(){
                var val = _getValue(target);
                if(val.length === 0){ return null; }
                
                if(val.length < min){
                    return context.Messages.LENGTH_MIN(min);
                }
                
                return null;
            });
        },
        
        max: function(target, max){
            context.addAction(target, function(){
                var val = _getValue(target);
                if(val.length === 0){ return null; }
                    
                if(val.length > max){
                    return context.Messages.LENGTH_MAX(max);
                }
                
                return null;
            });
        },
        
        len: function(target, min, max){
            context.addAction(target, function(){
                var val = _getValue(target);
                if(val.length === 0){ return null; }
                
                if(max){
                    if(val.length < min || val.length > max){
                        return context.Messages.LENGTH_RANGE(min, max);
                    }
                }else{
                    if(val.length != min){
                        return context.Messages.LENGTH(min);
                    }
                }
                
                return null;
            });
        },
        
        numonly: function(target){
            context.setRegexpRule(
                target
                , /^[0-9]+$/
                    , context.Messages.NUMBER_ONLY());
        },
        
        num: function(target){
            context.setRegexpRule(
                target
                , /^[\-+]?[0-9]*\.?[0-9]+$/
                    , context.Messages.NUMBER());
        },
        
        int: function(target){
            context.setRegexpRule(
                target
                , /^[\-+]?[0-9]+$/
                    , context.Messages.INTEGER());
        },
        
        range: function(target, min, max){
            context.addAction(target, function(){
                var val = _getValue(target);
                if(val.length === 0){ return null; }
                if( ! val.match(/^\-?[0-9]+$/)){ return null; }
                
                val = parseInt(val);
                if(val < min || val > max){
                    return context.Messages.NUMBER_RANGE(min, max);
                }
                
                return null;
            });
            
        },
        
        alpha: function(target){
            context.setRegexpRule(
                target
                , /^[a-zA-Z]+$/
                    , context.Messages.ALPHABET());
        },
        
        alphadash: function(target){
            context.setRegexpRule(
                target
                , /^([a-z0-9_\-])+$/i
                    , context.Messages.ALPHABET_DASH());
        },
        
        hankaku: function(target){
            context.setRegexpRule(
                target
                , /^[a-zA-Z0-9@\;\:\[\]\{\}\|\^\=\/\!\*\`\"\#\$\+\%\&\'\(\)\,\.\-\_\?\\\s]*$/
                    , context.Messages.HANKAKU());
        },
        
        zenkaku: function(target){
            context.setRegexpRule(
                target
                , /^[^a-zA-Z0-9@\;\:\[\]\{\}\|\^\=\/\!\*\"\#\$\+\%\&\'\(\)\,\.\-\_\?\\\s｡-ﾟ]+$/
                    , context.Messages.ZENKAKU());
        },
        
        hiragana: function(target){
            context.setRegexpRule(
                target
                , /^[あ-んぁ-ゎー～〜－・、。　]+$/
                    , context.Messages.HIRAGANA());
        },
        
        katakana: function(target){
            context.setRegexpRule(
                target
                , /^[ァ-ヶー～〜－・　、。]+$/
                    , context.Messages.KATAKANA());
        },
        
        hankana: function(target){
            context.setRegexpRule(
                target
                , /^[｡-ﾟ]+$/
                    , context.Messages.HANKANA());
        },
        
        email: function(target){
            context.setRegexpRule(
                target
                , /^[a-z0-9\+_\-\.]+@([a-z0-9\-]+\.)+[a-z]{2,6}$/i
                    , context.Messages.EMAIL());
        },
        
        url: function(target){
            context.setRegexpRule(
                target
                , /^http(s)?\:\/\/[^\/]*/
                , context.Messages.URL());
        },
        
        pair: function(target, targetCopy){
            context.addAction(targetCopy, function(){
                var val = _getValue(target);
                var copy = _getValue(targetCopy);
                
                if(val.length > 0 && copy.length > 0 && val !== copy){
                    return context.Messages.PAIR();
                }
                
                return null;
            });
        }
    
    };
    
    
    // Add default validation rules.
    context.addRule(new RegExp('^__trim$'),
        function(target, name){
            actions.trim(target, true, true);
        }
    );
    context.addRule(new RegExp('^__ltrim$'),
        function(target, name){
            actions.trim(target, true, false);
        }
    );
    context.addRule(new RegExp('^__rtrim$'),
        function(target, name){
            actions.trim(target, false, true);
        }
    );
    context.addRule(new RegExp('^__req$'),
        function(target, name){
            actions.req(target);
        }
    );
    context.addRule(new RegExp('^__min_([0-9]+)$'),
        function(target, name){
            actions.min(target, parseInt(RegExp.$1));
        }
    );
    context.addRule(new RegExp('^__max_([0-9]+)$'),
        function(target, name){
            actions.max(target, parseInt(RegExp.$1));
        }
    );
    context.addRule(new RegExp('^__len_([0-9]+)_?([0-9]+)?$'),
        function(target, name){
            actions.len(target, parseInt(RegExp.$1), (RegExp.$2) ? parseInt(RegExp.$2) : 0);
        }
    );
    context.addRule(new RegExp('^__range_([0-9]+)_([0-9]+)$'),
        function(target, name){
            actions.range(target, parseInt(RegExp.$1), parseInt(RegExp.$2));
        }
    );
    context.addRule(new RegExp('^__numonly$'),
        function(target, name){
            actions.numonly(target);
        }
    );
    context.addRule(new RegExp('^__num$'),
        function(target, name){
            actions.num(target);
        }
    );
    context.addRule(new RegExp('^__int$'),
        function(target, name){
            actions.int(target);
        }
    );
    context.addRule(new RegExp('^__alpha$'),
        function(target, name){
            actions.alpha(target);
        }
    );
    context.addRule(new RegExp('^__alphadash$'),
        function(target, name){
            actions.alphadash(target);
        }
    );
    context.addRule(new RegExp('^__hankaku$'),
        function(target, name){
            actions.hankaku(target);
        }
    );
    context.addRule(new RegExp('^__zenkaku$'),
        function(target, name){
            actions.zenkaku(target);
        }
    );
    context.addRule(new RegExp('^__hiragana$'),
        function(target, name){
            actions.hiragana(target);
        }
    );
    context.addRule(new RegExp('^__katakana$'),
        function(target, name){
            actions.katakana(target);
        }
    );
    context.addRule(new RegExp('^__hankana$'),
        function(target, name){
            actions.hankana(target);
        }
    );
    context.addRule(new RegExp('^__email$'),
        function(target, name){
            actions.email(target);
        }
    );
    context.addRule(new RegExp('^__url$'),
        function(target, name){
            actions.url(target);
        }
    );
    context.addRule(new RegExp('^__pair_([0-9a-zA-Z_\-]+)$'),
        function(target, name){
            var key = RegExp.$1;
            actions.pair(target, jQuery('.__paircopy_' + key).get(0));
        }
    );
    
    return context;
    
})();