//  mobileUndo 2.0.0, a script allowing reversion of edits on mobile.
//  All code is released under the default Wikipedia content license.
//  Installation instructions at [[User:FR30799386/undo]].
//  <doc>  This script basically connects an API endpoint to 
//         a mw-ui-destructive button which is added to the 
//         footer by using jQuery. Additional functionality 
//         includes changing the position of the thanks button
//         and the addition of a confirm dialog to the thank button,
//         to prevent mis-clicks due to both buttons being close 
//         to each other.
//  </doc>
//<nowiki>
$(document).ready(function(){
console.time('mobileUndo');
if (mw.config.get('wgTitle').split('f/')[0] === 'MobileDif') {
    //Page is a diff page
    //Interface construction
    mw.util.addCSS('#mw-mf-userinfo .mobileUndo-ui .mw-ui-icon.mw-ui-icon-before:before{display:none;}');
    //Thank module starts here
    $('#mw-mf-userinfo .post-content').append('<div class="mobileUndo-ui" style="display:inline-block; float:right;"></div>');
    $('.mobileUndo-ui').append($('.mw-mf-action-button').remove().css({
        'clear': 'none',
        'margin-top': '0.25em'
    }));
    if (!$('.warningbox').length && mw.config.get('wgRelevantPageIsProbablyEditable')) {
        //The real music, the undo button is created
        $('.mobileUndo-ui').append('<button class=\'mw-ui-button mw-ui-destructive\'' +
            ' id=\'mobileUndo\' style=\"margin-right:0.5em; margin-top:0.25em;\">' +
            '<img style="height:1.2em;" src=\"//upload.wikimedia.org/wikipedia/commons/b/ba/OOjs_UI_icon_editUndo-ltr-invert.svg\">' +
            '</img><span id="mobileUndo-text">Undo</span></button>');
        console.timeEnd('mobileUndo');
    }
}
});
$.when(mw.loader.using(['mediawiki.util', 'mediawiki.notify', 'mediawiki.api', 'oojs-ui-windows'])).then(function() {
    return new mw.Api().getMessages(['editundo', 'Undo-nochange'], {
        amlang: mw.user.options.get('language')
    });
}).then(function(globalmessages) {
	window.wgRelevantUser = function() {
    var user;
    	if ($('.mw-mf-user-link').text() !== '') {
        	user = $('.mw-mf-user-link').text();
    	} else {
        	user = $('#mw-mf-userinfo .post-content div:nth-child(2)').text();
    	}
    return user;
    };
    window.wgRevId = mw.config.get('wgTitle').split('f/')[1];
    var revId = wgRevId;
    var username = wgRelevantUser();
    $('#mobileUndo-text').text(globalmessages.editUndo);
    $('#mw-mf-userinfo .post-content .mobileUndo-ui .mw-mf-action-button').click(function(e) {
        e.preventDefault();
        OO.ui.confirm('Send public thanks ?').done(function(confirmed) {
            if (confirmed) {
                $('.mw-mf-action-button').prop('disabled', true).text('Thanking...');
                var api = new mw.Api();
                api.postWithToken('csrf', {
                    action: "thank",
                    rev: revId,
                }).done(function(result) {
                    mw.notify('You thanked ' + username + '.');
                    $('.mw-mf-action-button').text('Thanked');
                }).fail(function() {
                    mw.notify('Failed to thank ' + username + '.');
                    $('.mw-mf-action-button').text('Failed');
                });
            }
        });
    });

    $('#mobileUndo').click(function(e) {
        e.preventDefault();
        OO.ui.prompt('Add a reason to your edit summary !', {
            textInput: {
                placeholder: 'Reason...'
            }
        }).done(function(customEditSummary) {
            var editSummary = 'Undid revision ' +
                revId +
                ' by [[Special:Contributions/' + username + '|' + username + ']] ([[User talk:' + username + '|talk]]) ';
            if (customEditSummary !== null) {
            	document.getElementById("mobileUndo").disabled = true;
                editSummary = editSummary + customEditSummary + ' ([[w:en:User:FR30799386/undo|mobileUndo]])';
                //call the API
                var api = new mw.Api({
                    ajax: {
                        headers: {
                            'Api-User-Agent': 'mobileUndo/2.0.0(https://en.wikipedia.org/wiki/User:FR30799386/undo.js)'
                        }
                    }
                });
                //Feedback UI
                $('#mobileUndo').text('Loading...');
                api.postWithToken('csrf', {
                    action: "edit",
                    title: mw.config.get('wgRelevantPageName'),
                    summary: editSummary,
                    undo: revId,
                }).done(function(result) {
                    if (typeof result.edit.nochange !== 'undefined') {
                        $('#mobileUndo').text('Failed');
                        $('#mw-mf-diff-info').append('<br><div style="font-size:90%; background:#FFC0CB; padding:5px;">' +
                            globalmessages['Undo-nochange'] +
                            ' <br><span style="font-size:85%">If this error message sounds to tech oriented,' +
                            ' please drop a note at <a href="' + mw.util.getUrl('User talk:FR30799386') +
                            '">FR30799386\'s talk page</a>.</span></div>'
                        );
                        location.href = location.href + '#mw-mf-diff-info';
                        return;
                    }
                    $('#mobileUndo').text('Sucessful');
                    mw.notify('Revert sucessful....Reloading in a sec');
                    setTimeout(function() {
                        location.href = mw.util.getUrl('Special:MobileDiff/' + result.edit.newrevid);
                    }, 1500);
                    console.log(result);
                }).fail(function(code, jqxhr) {
                    $('#mobileUndo').text('Failed');
                    var details;
                    if (code === 'http' && jqxhr.textStatus === 'error') {
                        details = 'HTTP error: ' + jqxhr.xhr.status;
                    } else if (code === 'http') {
                        details = 'HTTP error: ' + jqxhr.textStatus;
                    } else if (code === 'ok-but-empty') {
                        details = 'An empty response was given the server';
                    } else {
                        details = jqxhr.error.info;
                    }
                    $('#mw-mf-diff-info').append('<br><div style="font-size:90%; background:#FFC0CB; padding:5px;">' +
                        details.charAt(0).toLowerCase() + details.slice(1) +
                        ' <br><span style="font-size:85%">If this error message sounds too tech oriented,' +
                        ' please drop a note at <a href="' + mw.util.getUrl('User talk:FR30799386') + '">FR30799386\'s talk page</a>.</span></div>');
                    location.href = location.href + '#mw-mf-diff-info';
                });
            }
        });

    });
});
//End of code
//</nowiki>
