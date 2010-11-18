var Validator = (function(){

    var context = {},
        consts = {
            VALIDATOR:'validator',
            HAS_VALIDATOR:'hasValidator',
            ERROR_MSG:'__form_error'
        },
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
    
    
    context = {
        
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
                }
                
                return check.valid;
                
            });
            
        },
        
        makeMessage: function(msg){
            return '<div class="' + consts.ERROR_MSG + '" style="color:red;">' + msg + '</div>';
        },
        
        bind: function(pnl){
            
            var actions = context.Actions;
            
            jQuery(':regex(class, ^__.+)', pnl).each(function(){
                
                var target = jQuery(this).get(0);
                
                jQuery.each(jQuery(target).attr('class').split(/\s+/), function(_, e){
                    
                    if(e === '__trim'){
                        actions.trim(target, true, true);
                    }else if(e === '__ltrim'){
                        actions.trim(target, true, false);
                    }else if(e === '__rtrim'){
                        actions.trim(target, false, true);
                    }else if(e === '__req'){
                        actions.req(target);
                    }else if(e.match(/^__min_([0-9]+)$/)){
                        actions.min(target, parseInt(RegExp.$1));
                    }else if(e.match(/^__max_([0-9]+)$/)){
                        actions.max(target, parseInt(RegExp.$1));
                    }else if(e.match(/^__len_([0-9]+)_?([0-9]+)?$/)){
                        actions.len(target, parseInt(RegExp.$1), (RegExp.$2) ? parseInt(RegExp.$2) : 0);
                    }else if(e.match(/^__range_([0-9]+)_([0-9]+)$/)){
                        actions.range(target, parseInt(RegExp.$1), parseInt(RegExp.$2));
                    }else if(e === '__numonly'){
                        actions.numonly(target);
                    }else if(e === '__num'){
                        actions.num(target);
                    }else if(e === '__int'){
                        actions.int(target);
                    }else if(e === '__alpha'){
                        actions.alpha(target);
                    }else if(e === '__alphadash'){
                        actions.alphadash(target);
                    }else if(e === '__hankaku'){
                        actions.hankaku(target);
                    }else if(e === '__zenkaku'){
                        actions.zenkaku(target);
                    }else if(e === '__hiragana'){
                        actions.hiragana(target);
                    }else if(e === '__katakana'){
                        actions.katakana(target);
                    }else if(e === '__hankana'){
                        actions.hankana(target);
                    }else if(e === '__email'){
                        actions.email(target);
                    }else if(e === '__url'){
                        actions.url(target);
                    }else if(e.match(/^__pair_([0-9a-zA-Z_\-]+)$/)){
                        var key = RegExp.$1;
                        actions.pair(target, jQuery('.__paircopy_' + key).get(0));
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
        
    };
    
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
    
    context.Actions = {
        
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
                    if(val.length === 0){
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
                , /^[^\@]+?@[A-Za-z0-9_\.\-]+\.+[A-Za-z\.\-\_]+$/
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
    
    return context;
    
})();