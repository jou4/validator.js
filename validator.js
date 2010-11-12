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
        };


    context = {
        
        defaultLoad: function(){
            
            context.bind(document.body);
            
            jQuery('form').submit(function(){
                
                jQuery('.' + consts.ERROR_MSG, this).remove();
                
                var check = context.check(this);
                
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
            return '<div class="' + consts.ERROR_MSG + '" style="color:red;">' + msg + '<div>';
        },
        
        bind: function(pnl){

            pnl = pnl || document;
            
            // __trim, __ltrim, __rtrim - トリム
            jQuery(':regex(class, ^__trim|__ltrim|__rtrim$)', pnl).each(function(){
                var target = jQuery(this).get(0);
                var as = context.getActions(target);

                var className = $(target).get(0).className;
                var ltrim = className.match(/(__trim)|(__ltrim)/);
                var rtrim = className.match(/(__trim)|(__rtrim)/);
                
                as.push(function(){
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
                
                context.setActions(target, as);
            });
            
            
            // __required - 必須
            jQuery('.__req', pnl).each(function(){
                var target = jQuery(this).get(0);
                var as = context.getActions(target);
                
                if(_isCheckBox(target)){
                    as.push(function(){
                        if( ! jQuery(target).attr('checked')){
                            return context.Messages.REQUIRED_CHECK();
                        }
                        return null;
                    });
                }else{
                    as.push(function(){
                        var val = _getValue(target);
                        if(val.length === 0){
                            return context.Messages.REQUIRED_INPUT();
                        }
                        return null;
                    });
                }
                
                context.setActions(target, as);
            });
            
            
            // __min_[min] - 最低文字数
            $(':regex(class, ^__min_([0-9]+)$)', pnl).each(function(){
                var target = jQuery(this).get(0);
                var as = context.getActions(target);
                
                var className = $(target).get(0).className;
                var min = (className.match(/__min_([0-9]+)/)) ? parseInt(RegExp.$1) : 0;
                
                as.push(function(){
                    var val = _getValue(target);
                    if(val.length === 0){ return null; }
                    
                    if(val.length < min){
                        return context.Messages.LENGTH_MIN(min);
                    }
                    
                    return null;
                });
                
                context.setActions(target, as);
            });
            

            // __max_[max] - 最大文字数
            $(':regex(class, ^__max_([0-9]+)$)', pnl).each(function(){
                var target = jQuery(this).get(0);
                var as = context.getActions(target);
                
                var className = $(target).get(0).className;
                var max = (className.match(/__max_([0-9]+)/)) ? parseInt(RegExp.$1) : 0;
                
                as.push(function(){
                    var val = _getValue(target);
                    if(val.length === 0){ return null; }
                        
                    if(val.length > max){
                        return context.Messages.LENGTH_MAX(max);
                    }
                    
                    return null;
                });
                
                context.setActions(target, as);
            });
            
            
            // __len_[min](_[max]) - 文字数
            // ※[max]省略時、文字列長と[min]が一致するかをチェックする
            $('input:regex(class, ^__len_([0-9]+)_?([0-9]+)?$)', pnl).each(function(){
                var target = jQuery(this).get(0);
                var as = context.getActions(target);
                
                var min = 0, max = 0;
                
                var className = $(target).get(0).className;
                if(className.match(/__len_([0-9]+)_?([0-9]+)?/)){
                    min = parseInt(RegExp.$1);
                    max = (RegExp.$2) ? parseInt(RegExp.$2) : 0;
                }
                
                as.push(function(){
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
                
                context.setActions(target, as);
            });
            
                
            // __numonly - 半角数字のみ
            jQuery('.__numonly', pnl).each(function(){
                context.setRegexpRule(
                    jQuery(this).get(0)
                    , /^[0-9]+$/
                        , context.Messages.NUMBER_ONLY());
            });
            
            
            // __num - 数値
            jQuery('.__num', pnl).each(function(){
                context.setRegexpRule(
                    jQuery(this).get(0)
                    , /^\-?[0-9]+$/
                        , context.Messages.NUMBER());
            });
            
            
            // __range_[min]_[max] - 数値範囲
            // ※[max]省略時、文字列長と[min]が一致するかをチェックする
            $('input:regex(class, ^__range_([0-9]+)_([0-9]+)$)', pnl).each(function(){
                var target = jQuery(this).get(0);
                var as = context.getActions(target);
                
                var min = 0, max = 0;
                
                var className = $(target).get(0).className;
                if(className.match(/__range_([0-9]+)_([0-9]+)/)){
                    min = parseInt(RegExp.$1);
                    max = parseInt(RegExp.$2);
                }
                
                as.push(function(){
                    var val = _getValue(target);
                    if(val.length === 0){ return null; }
                    if( ! val.match(/^\-?[0-9]+$/)){ return null; }
                    
                    val = parseInt(val);
                    if(val < min || val > max){
                        return context.Messages.NUMBER_RANGE(min, max);
                    }
                    
                    return null;
                });
                
                context.setActions(target, as);
            });
            
            
            // __alpha - アルファベットのみ
            jQuery('.__alpha', pnl).each(function(){
                context.setRegexpRule(
                    jQuery(this).get(0)
                    , /^[a-zA-Z]+$/
                        , context.Messages.ALPHABET());
            });
            
            
            // __hankaku - 半角文字のみ（半角カナは除く）
            jQuery('.__hankaku', pnl).each(function(){
                context.setRegexpRule(
                    jQuery(this).get(0)
                    , /^[a-zA-Z0-9@\;\:\[\]\{\}\|\^\=\/\!\*\`\"\#\$\+\%\&\'\(\)\,\.\-\_\?\\\s]*$/
                        , context.Messages.HANKAKU());
            });
            
            
            // __zenkaku - 全角文字のみ（半角カナは除く）
            jQuery('.__zenkaku', pnl).each(function(){
                context.setRegexpRule(
                    jQuery(this).get(0)
                    , /^[^a-zA-Z0-9@\;\:\[\]\{\}\|\^\=\/\!\*\"\#\$\+\%\&\'\(\)\,\.\-\_\?\\\s｡-ﾟ]+$/
                        , context.Messages.ZENKAKU());
            });
            
            
            // __hiragana - ひらがなのみ
            jQuery('.__hiragana', pnl).each(function(){
                context.setRegexpRule(
                    jQuery(this).get(0)
                    , /^[あ-んぁ-ゎー～〜－・、。　]+$/
                        , context.Messages.HIRAGANA());
            });
            
            
            // __katakana - 全角カタカナのみ
            jQuery('.__katakana', pnl).each(function(){
                context.setRegexpRule(
                    jQuery(this).get(0)
                    , /^[ァ-ヶー～〜－・　、。]+$/
                        , context.Messages.KATAKANA());
            });
                
            
            // __hankana - 半角カタカナのみ
                jQuery('.__hankana', pnl).each(function(){
                    context.setRegexpRule(
                        jQuery(this).get(0)
                        , /^[｡-ﾟ]+$/
                            , context.Messages.HANKANA());
                });
            
            
            // __email - メールアドレス
            jQuery('.__email', pnl).each(function(){
                context.setRegexpRule(
                    jQuery(this).get(0)
                    , /^[^\@]+?@[A-Za-z0-9_\.\-]+\.+[A-Za-z\.\-\_]+$/
                        , context.Messages.EMAIL());
            });
            
            
            // __url - URL
            jQuery('.__url', pnl).each(function(){
                context.setRegexpRule(
                    jQuery(this).get(0)
                    , /^http(s)?\:\/\/[^\/]*/
                    , context.Messages.URL());
            });
            
            
            // __pair_[key], __paircopy_[key] - 同一確認
            jQuery(':regex(class, ^__pair_([0-9a-zA-Z]+)$)', pnl).each(function(){
                var target = jQuery(this).get(0);
                
                var className = $(target).get(0).className;
                var key = (className.match(/__pair_([0-9a-zA-Z]+)/)) ? RegExp.$1 : '';
                
                if(key.length === 0){ return; }
                
                var targetCopy = jQuery('.__paircopy_' + key).get(0);
                var as = context.getActions(targetCopy);
                
                as.push(function(){
                    var val = _getValue(target);
                    var copy = _getValue(targetCopy);
                    
                    if(val.length > 0 && copy.length > 0 && val !== copy){
                        return context.Messages.PAIR();
                    }
                    
                    return null;
                });
                
                context.setActions(targetCopy, as);
            });
            
        },
        
        check: function(pnl){
            
            var result = {valid:true, errors:[]};
            
            jQuery(':regex(data:' + consts.HAS_VALIDATOR + ', yes)', pnl).each(function(){
                
                var as = context.getActions(this);
                var a, r;
                for(var i=0,l=as.length; i<l; ++i){
                    a = as[i];
                    r = a();
                    if(r){
                        result.valid = false;
                        result.errors.push({target:jQuery(this).get(0), msg:r});
                    }
                }
            });
            
            return result;
            
        },
        
        getActions: function(target){
            return (jQuery(target).data(consts.VALIDATOR)) ? jQuery(target).data(consts.VALIDATOR) : [];
        },
        
        setActions: function(target, as){
            jQuery(target).data(consts.HAS_VALIDATOR, 'yes');
            jQuery(target).data(consts.VALIDATOR, as);
        },
        
        
        setRegexpRule: function(target, regex, msg){
            var as = context.getActions(target);
            
            as.push(function(){
                var val = _getValue(target);
                if(val.length === 0){ return null; }
                
                if( ! val.match(regex)){
                    return msg;
                }
                
                return null;
            });
            
            context.setActions(target, as);
        }
        
    };
    
    context.Messages = {
        REQUIRED_CHECK:function(){ return 'チェックしてください。'; },
        REQUIRED_INPUT:function(){ return '入力してください。'; },
        LENGTH_MIN:function(min){ return min + '文字以上で入力してください。'; },
        LENGTH_MAX:function(max){ return max + '文字以内で入力してください。'; },
        LENGTH_RANGE:function(min, max){ return min + '文字以上' + max + '文字以下で入力してください。'; },
        LENGTH:function(len){ return len + '文字で入力してください。'; },
        NUMBER_ONLY:function(){ return '半角数字のみで入力してください。'; },
        NUMBER:function(){ return '数値を入力してください。'; },
        NUMBER_RANGE:function(min, max){ return min + '以上' + max + '以下の数値を入力してください。'; },
        ALPHABET:function(){ return 'アルファベットのみで入力してください。'; },
        HANKAKU:function(){ return '半角文字で入力してください。'; },
        ZENKAKU:function(){ return '全角文字で入力してください。'; },
        HIRAGANA:function(){ return 'ひらがなで入力してください。'; },
        KATAKANA:function(){ return '全角カタカナで入力してください。'; },
        HANKANA:function(){ return '半角カタカナで入力してください。'; },
        EMAIL:function(){ return '正しいメールアドレスの形式で入力してください。'; },
        URL:function(){ return '正しいURLの形式で入力してください。'; },
        PAIR:function(){ return '入力内容が異なります。'; }
    };
    
    return context;
    
})();