/**
 * icSelectionBox jQuery plugin
 * version 0.1 
 * simple box for picking one or more selected items - also includes search and can be modal
 * Copyright (c) 2009-2001 IgorCrevar <crewce@hotmail.com>
 *
 * Licensed under the MIT (MIT-LICENSE.txt) 
 *
 **/
 
 /* user format:
   		{id: ID,
   		title: whatever}
    users format: [user1, user2, ...];
 */
(function($) {

	$.icSelectionBox = function (options) { //constructor
  
  		var defaultOptions = {
		    multi: false, //could we specify more then one user
		    onOkClick:function(users, el, searchValue){
				return true;
			}, //handler for ok
		    onCancelClick:function(el){ 
		    	return true;
		    }, //handler for cancel
		    url: false, //must specify
			modal: true,
			hasCancel: true,
			parentElement: false, //must be jquery element - selectionbox will be its child - this will only works if its not modal box
		    users: false, //array of users in above specified formar
			takeButtonTitle: 'Take',
		 	cancelButtonTitle: 'Cancel',
		 	classPrefix: 'icSelectionBox',
			forceAjaxLoad: true
		};		
		options = $.extend( true, defaultOptions, options);
		
		var users = new Array(); //picked users
		var  indexSelected = -1; //for single selected only
		var _mainDiv = $('<div></div>').addClass(options.classPrefix);
		var _list = $('<div></div>').addClass(options.classPrefix+'List');
		var textInputValue = '';
	
	 	 
		if ( options.modal )
		{
			var mdiv = $('<div></div>').appendTo($('body')).css('z-index', '8023');
			mdiv.css('backgroundColor', '#000');
			mdiv.height( $(document).height() );
			mdiv.width( $(document).width() );
			mdiv.css('position', 'absolute');
			mdiv.css('top', 0);
			mdiv.css('left', 0);
			mdiv.get(0).style.MozOpacity = .65;
			mdiv.get(0).style.opacity = .65;
			mdiv.get(0).style.filter = "alpha(opacity=65)";
		}
		 
		
		//users can be past in options
		if ( options.users ){
			$.icSelectionBoxUsers = options.users;
			initSelectionBox();
		}
		
		else if ( typeof $.icSelectionBoxUsers == 'undefined'  ||  options.forceAjaxLoad )
		{		
			$.ajax({
				success: function(msg){					    
					options.users = $.icSelectionBoxUsers = eval(msg);
					initSelectionBox();
				},
				erorr:function(){},
				url: options.url
	  		});	

		}
		else {
			options.users = $.icSelectionBoxUsers;
			initSelectionBox();
		}
	   
		//this is the main 
		function initSelectionBox()
		{
			for (i in options.users){
				users[i] = { title: options.users[i].title, id: options.users[i].id, visible: true, selected: false };
				_obj = $('<a></a>').attr('href','#').attr('id',options.classPrefix+'ListUser'+i).css('display', 'block');
				_obj.html(users[i].title);  	 	 
				_obj.bind('mousedown', function(e){
				if (e.which!=1) return false;
					index = parseInt( this.id.substr((options.classPrefix+'ListUser').length) );
					users[index].selected = !users[index].selected;
					if ( users[index].selected  ){
						if ( !options.multi  &&  indexSelected != -1  &&  index != indexSelected)
						{
							users[indexSelected].selected = false;
							users[indexSelected].obj.removeClass('selected');
						}
						indexSelected = users[index].selected ? index : -1;
						$(this).addClass('selected');
					}
					else{
						$(this).removeClass('selected')
					}
					e.stopPropagation();
					return false;
				}).click(function(){ return false; });  	 	 
				_obj.appendTo(_list);
				users[i].obj = _obj;
			}
			 
			var _input = $('<input />').attr('type','text').addClass( options.classPrefix+'Input' );
			_input.bind('keydown', function(e){
				search(textInputValue=$(this).val());
			});	  	 
			_input.bind('keyup', function(e){
				search(textInputValue=$(this).val());
			});	
			_mainDiv.append(_input);		 
			_list.addClass(options.classPrefix+'List').appendTo(_mainDiv);
			 

			var omDiv = $('<div></div>');
			omDiv.addClass(options.classPrefix+'Buttons').appendTo(_mainDiv);
			 
			var _ok = $('<a></a>').attr('href','#').addClass(options.classPrefix+'ButtonsButton1')
			_ok.html(options.takeButtonTitle);
			omDiv.append(_ok);
			_ok.click( function(){
				var r = options.onOkClick(getSelected(),_mainDiv, textInputValue );
				if ( r ) close();
				return false;
			});
			 
			if ( options.hasCancel )
			{
				var _cancel = $('<a></a>').attr('href','#').addClass(options.classPrefix+'ButtonsButton2');
				_cancel.html(options.cancelButtonTitle);
				omDiv.append(_cancel);
				_cancel.click( function(e){
					var r = options.onCancelClick(_mainDiv);
					if ( r ) close();
					return false;
				});
			}
			 
			if (!options.parentElement )
			{
				_mainDiv.appendTo($('body'));
				_mainDiv.css('position', 'absolute');
				_mainDiv.css('zIndex', '8024');
				_mainDiv.css('top', ($(window).height()-_mainDiv.height())/2);
				_mainDiv.css('left', ($(window).width()-_mainDiv.width())/2);
			}
			else
			{
				_mainDiv.appendTo(options.parentElement);
			}
			 
			function getSelected(){
				var selUsers = new Array();
				j = 0;
				for (i in users) {
					if (users[i].selected){ 
						selUsers[j++] = {id: users[i].id, title: users[i].title };
					}
				}
				return selUsers;
			}

				 
			function search(txt)
			{ 
				txt = txt.toLowerCase();
				for (i in users){
					display = users[i].title.toLowerCase().indexOf(txt) != -1;
					users[i].visible = display;
					users[i].obj.css('display', display ? 'block' : 'none' );
				}
			}
		}
	 
		function close()
		{
			if (mdiv) mdiv.remove();
			_mainDiv.remove();
		};
		this.close = close; //if we use as instance of class
		$.icSelectionBoxClose = close; //make close global jquery func

	};

})(jQuery);
