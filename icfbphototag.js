/**
 * icfbPhotoTag jQuery plugin
 * version 0.99 beta
 *
 * this plugin is specially designed for picture/photo tagging like facebook photo tagging
 * Copyright (c) 2009-2011 IgorCrevar <crewce@hotmail.com>
 *
 * Licensed under the MIT (MIT-LICENSE.txt) 
 *
 **/

(function($) {
	$.fn.icfbPhotoTag = function (options) { 
		var defaultOptions = {
			boxClass: 'icfbPhotoTag',
			boxWidth:120, //width of box when created first time
			boxHeight:120, 
			minBoxWidth:80,
			minBoxHeight:80,
			borderSize:2,
    	 	onMouseOverBox: function(data) { //{ title, id, obj, coords, boxClass :options.boxClass };
				//best to override with crew tooltip plugin :)
				o=$('#'+data.boxClass+'Title'+data.id);
				if (!o.length) o=$('<div></div>').attr('id',data.boxClass+'Title'+data.id).addClass(data.boxClass+'Title').appendTo($('body'));
				o.css({'left':(data.coords.x+10)+'px', 'top':data.coords.y+'px'});
				o.css('position', 'absolute');
				o.html(data.title);
    	 	}, //user mouse over function (when we not editing)    	 	 
    	 	onMouseOutOfBox: function(data) { //{ title, id, obj, coords, boxClass :options.boxClass };
    	 	 	$('#'+data.boxClass+'Title'+data.id).remove();
    	 	}, //user mouse out function (when we not editing)    	 	 
    	 	status: false,    	 	 
			boxes: [] //no selected boxes
    	 	//coordsShow: false
		};
		this.icfbPhotoTag = new $.icfbPhotoTag(this, $.extend( true, options, defaultOptions) );
		return this;
	}
  
	$.icfbPhotoTag = function (image, options) { //constructor
		var boxes = []; //all selection boxes 
		//list of structures: obj, id, index, visible, title, start, end 
		var boxesCounter = 0; //counter fox boxes - like Primary KEY autoincrement :)
		var imageBox = {};
		var startCoord; //previous mouse positions
		var mainDiv;
		var overrideDiv; //used to put in front of image - to disable standard image events
		var status = -1; // -1 => undefined, 0 => viewing, 1 => editing, 2 => adding, 3 => adding picked
		var cursors = ['default', 'move','nw-resize', 'n-resize', 'ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize', 'crosshair'];
		var mouseDragMode; 
		var draggedResizedBox = false;
		//1 - drag, 2 - left-top, 3-top, 4-top-right, 5 = right, 6 = bottom-right
		//7 - bottom, 8 - bottom-left, 9 - left, just editing = 10, 0 = nothing
		var boxesValuesBeforeEdit;
     	
		function cloneBox(b)
		{
			return { index: b.index, obj: b.obj, title: b.title, id: b.id, visible: b.visible, start: { x: b.start.x+0, y: b.start.y+0 }, end:  { x: b.end.x+0, y: b.end.y+0 }
					,width: b.width, height: b.height };
		}
		
		function getBoxIndexById(_id){ //helper function for finding index in boxes for which boxes[index].id=_id
			for (i in boxes)
				if ( boxes[i].id == _id ) return i;
			return -1; //if you pass invalid parameter
    	}
    	
    	function getBoxFromCoords(_coords)  //false if cant find
    	{
			for (i=boxes.length-1;i>=0;--i)
			{
				if ( boxes[i].visible && _coords.x >= boxes[i].start.x  && _coords.x <= boxes[i].end.x && 
					 _coords.y >= boxes[i].start.y  && _coords.y <= boxes[i].end.y ){
						//calculate editing mode
					return boxes[i];
				}
			}		
			return false;
    	}
    	
    	function isInside(c){  //check coords to see if they are inside image
    		return c.x >= imageBox.x1 && c.x <= imageBox.x2 && c.y >= imageBox.y1 && c.y <= imageBox.y2;
    	}
    		
    	function setDragMode(w)
    	{
    		 if ( mouseDragMode == w ) return;
    		 mouseDragMode = w;
    		 image.css('cursor', cursors[w]);
    		 if ( overrideDiv ) overrideDiv.css('cursor', cursors[w]);
    	}
    	
    	function swapCoords(c1,c2){
    		 return [{x:Math.min(c1.x,c2.x),y:Math.min(c1.y,c2.y)},
    		 				 {x:Math.max(c1.x,c2.x),y:Math.max(c1.y,c2.y)}];
    	}
    	
    	function boxSetCoords(i,sc, ec)
    	{
    		tmp = swapCoords(sc,ec);
    		sc = tmp[0];
    		ec = tmp[1];
    		width = ec.x - sc.x+1;
    		if ( width < options.minBoxWidth ) width = options.minBoxWidth;
    		height = ec.y - sc.y+1;
    		if ( height < options.minBoxheight ) height = options.minBoxheight;
    		if ( sc.x < 0 ){
    			ec.x = width-1;
    			sc.x = 0; 
    		}
    		if ( sc.y < 0 ){
    			 ec.y = height-1;
    			 sc.y = 0;
    		}
    		if ( ec.x >= imageBox.width ){
    			sc.x = imageBox.width-width;
    			ec.x = imageBox.width-1;    			
    		}
    		if ( ec.y >= imageBox.height ){
    			sc.y = imageBox.height-height;
    			ec.y = imageBox.height-1;
    		}
    		boxes[i].start = sc; 
    		boxes[i].end = ec;
    		boxes[i].width = (ec.x-sc.x+1);
    		boxes[i].height = (ec.y-sc.y+1);
    		boxes[i].obj.css({'left':(sc.x)+'px', 'top':(sc.y)+'px','width':width+'px', 'height':height+'px'});
    	}    	    	
    	
    	function setTitleOfLast(_title){
			boxes[boxes.length-1].title = _title;
			return this;
		}
		function setIdOfLast(_id){
			boxes[boxes.length-1].id = _id;
			boxes[boxes.length-1].obj.attr('id', options.boxClass+_id);
			if ( boxesCounter < _id ) boxesCounter = _id;
			return this;
		}
    	
		function addBox(_id, sCoord, eCoord, _title, _visible )
		{
			if (_id){
				if ( boxesCounter < _id ) boxesCounter = _id; //cant be less then passed _id
			}
			else{
				_id = ++boxesCounter;
			}
			var _obj = $('<div></div>').addClass(options.boxClass).attr('id', options.boxClass+_id).css('z-index', 1024); //i think 1024 is enough :)
			var divs = ['Up', 'Down', 'Left', 'Right'];
			for (i=0;i<divs.length;++i)
			  _obj.append( $('<div></div>').addClass(options.boxClass+divs[i]) );
			var _index = boxes.length; 
			boxes[_index] = { index:_index, obj: _obj, title:_title, id:_id, visible: _visible };      	
			_visible ? _obj.show() : _obj.hide();
			overrideDiv.append(_obj);
			boxSetCoords(_index, sCoord, eCoord);
		}
      
		//gets last box - for example when you adding new after stop to pick it up
		function getLastBox()
		{
			if (!boxes.length) return { id:0,x1:0,x2:0,y1:0,y2:0,title:'' };
			var b=boxes[boxes.length-1];
			return { id:b.id,x1:b.start.x,x2:b.end.x,y1:b.start.y,y2:b.end.y,title:b.title };
		}
		//returns array of boxes tagged
		function getBoxes(){ 
		 	var rv = new Array();
			for (var i=0;i<boxes.length;++i){
				b=boxes[i];
				rv[i]={ id:b.id,x1:b.start.x,x2:b.end.x,y1:b.start.y,y2:b.end.y,title:b.title };      	 	  
			}
			return rv;
		}
      
		function displayBoxes(show,_index)
		{
			if ( typeof _index != 'undefined'  &&  _index != -1 ) {
      			boxes[_index].visible = show;
				boxes[_index].obj.css( 'display', show ? 'block' : 'none' );
			}
			else{
				 for (i in boxes){
					 boxes[i].visible = show;
					 boxes[i].obj.css( 'display', show ? 'block' : 'none' );
				 }
			}				
		}
		function removeBox(_index) 
		{
			if ( _index != -1 ) 
			{      		   
				boxes[_index].obj.remove();//from DOM
				j = boxes.length;  
				k = 0;
				for (i=0;i<j;++i){
					if (i==_index) continue;      			
					boxes[k] = boxes[i];
					boxes[k].index=k;
					++k;
				}
				boxes.length = boxes.length-1;
			}
			else
			{
				 if ( !boxes.length ) return false;  //there is nothing to erase
				 boxes[boxes.length-1].obj.remove();
				 boxes.length = boxes.length-1;
			}
		}
		
		function removeBoxById(_id)
		{
			removeBox( getBoxIndexById(_id) );
		}
		      
		function mouseUp(event) //we bind it with one
		{
			var coords = getMouseCoords(event,false);
			draggedResizedBox = false;
			setDragMode( 10 );	 //back to edit cursor
			event.preventDefault(); //do not allow event bubbling/event handlers propagation
			return false;
		}
	
		function mouseMove(event)	
		{
			if ( status == -1) return false; //not draging or resizing

			if ( status == 0 ){  //viewing
				var c = getMouseCoords(event, false); //get non cliped mouse coords
				box = getBoxFromCoords(c);
				c = {x:imageBox.x1+c.x,y:imageBox.y1+c.y}; //we need aboslute coordinates for this :)
				if ( draggedResizedBox && ( !box  ||  draggedResizedBox.id != box.id ) ){
					var data = { title:draggedResizedBox.title, id: draggedResizedBox.id, obj: draggedResizedBox.obj, coords: c, boxClass:options.boxClass };
					options.onMouseOutOfBox( data );
				}
				if ( box )// &&  (!draggedResizedBox  ||  draggedResizedBox.id != box.id) )
				{
					var data = { title:box.title, id: box.id, obj: box.obj, coords: c, boxClass:options.boxClass };
					options.onMouseOverBox(	data );
				}
				draggedResizedBox = box;
				return true;
			}
			else //editing/adding
			{					
				if (draggedResizedBox)
				{
					 var c = getMouseCoords(event, true); //get clipped mouse coords
					 if ( mouseDragMode == 1){
							start = {x:c.x-startCoord.x, y: c.y-startCoord.y};
							end = {x:start.x+draggedResizedBox.width-1,y:start.y+draggedResizedBox.height-1};
					 }
					 else{
						start = {x:draggedResizedBox.start.x,y:draggedResizedBox.start.y};
						end = {x:draggedResizedBox.end.x,y:draggedResizedBox.end.y};
						
						var canMoveX = [2,4,5,6,8,9];
						var canMoveY = [2,3,4,6,7,8];
						if ( $.inArray(mouseDragMode, canMoveX) + 1 )
						{
							if ( mouseDragMode >= 4 && mouseDragMode <= 6 ){ //move right part
								 if ( c.x  >=  draggedResizedBox.start.x  &&  c.x - draggedResizedBox.start.x + 1 >= options.minBoxWidth ){
									 start.x = draggedResizedBox.start.x;
									 end.x = c.x;
								 }
							}
							else{
								 if ( c.x  <= draggedResizedBox.end.x  &&  draggedResizedBox.end.x - c.x + 1 >= options.minBoxWidth  ){
									 end.x = draggedResizedBox.end.x;
									 start.x = c.x;
								 }
							}					 	  
						  }
						  if ( $.inArray(mouseDragMode, canMoveY) + 1 )
						{
							if ( mouseDragMode <= 4 ){ //move upper part
							if ( c.y  <= draggedResizedBox.end.y  &&  draggedResizedBox.end.y - c.y + 1 >= options.minBoxHeight  ){
									 end.y = draggedResizedBox.end.y;
									 start.y = c.y;
								}			 	    		  
							}
							else{
								if ( c.y  >=  draggedResizedBox.start.y  &&  c.y - draggedResizedBox.start.y + 1 >= options.minBoxHeight ){
									 start.y = draggedResizedBox.start.y;
									 end.y = c.y;
								}
							}		
						  }		
						  startCoord = c;
					 }		
					 boxSetCoords(draggedResizedBox.index, start, end );
				}
				else{
					var c = getMouseCoords(event, false); //get non cliped mouse coords						
					if ( c.x != -1  &&  c.y != -1  &&  (tmpBox = getBoxFromCoords(c)) ){
						 if (c.x <= tmpBox.start.x+options.borderSize+1 ){
							  if ( c.y <= tmpBox.start.y+options.borderSize+1 ){
								setDragMode( 2 );	
							  }
							  else if ( c.y <= tmpBox.end.y-options.borderSize-1  ){
								setDragMode( 9 );	
							  }
							  else{
								setDragMode( 8 );	
							  }							 	  
						 }
						 else if ( c.x >= tmpBox.end.x-options.borderSize-1 ){
								if ( c.y <= tmpBox.start.y+options.borderSize+1 ){
								setDragMode( 4 );	
							  }
							  else if ( c.y <= tmpBox.end.y-options.borderSize-1  ){
								setDragMode( 5 );	
							  }
							  else{
								setDragMode( 6 );	
							  }			
						 }
						 else if ( c.y <= tmpBox.start.y+options.borderSize+1 ){
							  setDragMode( 3 );	
						 }
						 else if ( c.y >= tmpBox.end.y-options.borderSize-1 ){
							  setDragMode( 7 );	
						 }
						 else{
							 setDragMode( 1 );	
						 }
					}
					else if ( mouseDragMode != 10 ){
						 setDragMode( 10 );	
					}
					
				}
			}
			event.preventDefault() //do not allow event bubbling/event handlers propagation
			return false;
		}
	    
		function mouseDown(event)
		{
			if ( event.which != 1 ) return false; //not pressed left button
			$(document).one( 'mouseup', mouseUp );								  
			startCoord = getMouseCoords(event,false); //pick start(mouse) coords

			draggedResizedBox = getBoxFromCoords(startCoord);
			if ( draggedResizedBox )
			{
				 startCoord = {x:startCoord.x-draggedResizedBox.start.x, y:startCoord.y-draggedResizedBox.start.y};
			}
			else if ( status >= 2 )
			{
				  var pos1 = {x: startCoord.x - options.boxWidth / 2, y: startCoord.y - options.boxHeight / 2 };
				  var pos2 = {x: startCoord.x + options.boxWidth / 2 - (1-options.boxWidth % 2), y: startCoord.y + options.boxHeight / 2 - (1-options.boxHeight % 2) };
				  if ( status == 2 )
				  {
					addBox( false, pos1, pos2, false, true );
					status = 3; //so next time we just change coords of new box :)
				  }
				  else 
				  {
					boxSetCoords( boxes.length-1, pos1, pos2 ); //change position of last added 
				  }	   		 	  
			}
			event.preventDefault() //do not allow event bubbling/event handlers propagation
			return false;	
		}

		function getMouseCoords(e,clip)
		{						
			c = $.browser.msie  &&  e.clientX != undefined ?
			   { x: e.clientX + document.body.scrollLeft,
					 y: e.clientY + document.body.scrollTop} 
			:	 { x: e.pageX, y: e.pageY};
			if (!clip ){
				c.x = ( c.x >= imageBox.x1 && c.x <= imageBox.x2 ) ? c.x - imageBox.x1 : -1;
				c.y = ( c.y >= imageBox.y1 && c.y <= imageBox.y2 ) ? c.y - imageBox.y1 : -1;
			}
			else{
				c.x -= imageBox.x1;
				c.y -= imageBox.y1;
				if ( c.x < 0 ) c.x = 0;				
				if ( c.x >= imageBox.width ) c.x = imageBox.width-1;
				if ( c.y < 0 ) c.y = 0;
				if ( c.y >= imageBox.height ) c.y = imageBox.height-1;
			}
			return c;
		}	
	    
		function debug(c)
		{
			s = '';
			for (i in c) s += c[i].x+':'+c[i].y+'  ';
			options.coordsShow.html(s);
		}
			
		function statusViewing()
		{
			//clear old bindings
			if ( status > 0)
			{
				overrideDiv.unbind( 'mousedown', mouseDown );
				$(document).unbind( 'mouseup', mouseUp );
				overrideDiv.removeClass(options.boxClass+'ImageOverlayEdit');
			}
			displayBoxes(true,-1);
			overrideDiv.addClass(options.boxClass+'ImageOverlay');
			status = 0;
			setDragMode(0); //standard cursor
		}
			
		function statusEdit()
		{
			displayBoxes(true,-1);
			//remeber this for later reverting on cancel call
			boxesValuesBeforeEdit = [];
			for (var i=0;i<boxes.length;++i){
				boxesValuesBeforeEdit[i] = cloneBox(boxes[i]);
			}
			statusEditNew();		
			status = 1;
		}
		
		//we can pass parameter to specify that we dont want new box immediately
		function statusNew(notAdd)
		{
			displayBoxes(false,-1);
			statusEditNew();
			
			if ( !notAdd )
			{
				//if notAdd not specified or false put default new box at screen center and change status to 3(edit new box)
				var xx = (imageBox.width - options.boxWidth) / 2; 
				var yy = (imageBox.height - options.boxHeight) / 2;
				addBox( false, {x: xx, y: yy},{x: xx+options.boxWidth, y: yy+options.boxHeight}, false, true );
				status = 3;
			}
			else{
				status = 2; //otherwise we are in add new box state
			}
		}
		
		function statusEditNew()
		{
			draggedResizedBox = false;
			if ( status < 1 )
			{
				overrideDiv.removeClass(options.boxClass+'ImageOverlay');
				overrideDiv.addClass(options.boxClass+'ImageOverlayEdit');
				$(document).unbind( 'mouseup', mouseUp );				
				overrideDiv.bind( 'mousedown', mouseDown );	
			}
			setDragMode(10);	
		}
	
		function statusSave()
		{
			displayBoxes(false,-1);	
			status = -1; //undefined mode - start mode
			setDragMode(0); //standard cursor
			overrideDiv.unbind( 'mousedown', mouseDown );
			$(document).unbind( 'mouseup', mouseUp );
			overrideDiv.removeClass(options.boxClass+'ImageOverlay');
			overrideDiv.removeClass(options.boxClass+'ImageOverlayEdit');
		}
		
		function statusCancel()
		{
			if ( status == 1 ){
			//for edit do revert of old backup
				boxes = boxesValuesBeforeEdit;
				//we must also fix dom object positions
				for (i in boxes)
				{
					boxSetCoords(i, boxes[i].start, boxes[i].end);
				}
				
			}
			else if ( status > 1 ){
				//for new remove last box
				removeBox(boxes.length-1);
			}
			statusSave();
		}
						
		//make func public
		this.view = statusViewing;
		this.edit = statusEdit;
		this.add = statusNew;
		this.save = statusSave;
		this.cancel = statusCancel;
		this.removeBox = removeBox;
		this.removeBoxById = removeBoxById;		
		this.setTitleOfLast = setTitleOfLast;
		this.setIdOfLast = setIdOfLast;
		this.getLastBox = getLastBox;
		this.getBoxes = getBoxes;
		this.displayBoxes = displayBoxes;
		this.isNew = function(){
			return status > 1;
		};
		this.displayBox = function(_id,_visible){
			displayBoxes(_visible, getBoxIndexById(_id) );
		};
		
		//we must create main div add div a class and swap parents
		mainDiv = $('<div></div>').addClass( options.boxClass+'Image' );
		mainDiv.width( image.width() );
		mainDiv.height( image.height() );
		mainDiv.appendTo(image.parent());
		image.addClass( options.boxClass+'Image' ).appendTo(mainDiv); 
		mainDiv.css('z-index', '512');
		//for speed purposes calculate img box
		imageBox.x1 = image.offset().left;
		imageBox.y1 = image.offset().top;			
		imageBox.width = image.width();
		imageBox.height = image.height();
		imageBox.x2 = imageBox.x1 + imageBox.width - 1;
		imageBox.y2 = imageBox.y1 + imageBox.height - 1;
	  
		//create ovveride div(overlay)
		overrideDiv = $('<div></div>').appendTo(mainDiv);
		  
		//create boxes that already exists - passed as argument
		for (i in options.boxes){
			b = options.boxes[i];
			addBox( typeof b.id != 'undefined' ? b.id : false, {x:b.x1,y:b.y1}, {x:b.x2,y:b.y2}, typeof b.title != 'undefined' ? b.title : false, false);
		}                  	
		//add handler to mouse move - all time
		$(document).bind( 'mousemove', mouseMove );		
	};

})(jQuery);