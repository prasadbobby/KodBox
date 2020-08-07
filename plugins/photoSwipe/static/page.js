define(function(require, exports) {
	var getImageArr = function(filePath,name){
		var itemsArr = [];
		var index 	 = 0;
		var makeItem = function(filePath,name,$dom){
			itemsArr.push({
				src:core.pathImage(filePath,1200),
				msrc:core.pathImage(filePath,250),
				trueImage:core.pathImage(filePath,false),
				title:htmlEncode(name || ''),
				w:0,h:0,
				$dom:$dom
			});
		}
		
		var $files 	 = $("[data-path="+hashEncode(filePath)+"]");
		var $images  = $files.parent().find(".file .picture-show");
		if($images.length > 0){
			$images.each(function(i){
				var $file = $(this).parents('.file');
				var curPath  = hashDecode($file.attr('data-path'));
				makeItem(curPath,$file.attr('data-name'),$(this));
				if(curPath == filePath){
					index = i;
				}
			});
		}else{
			makeItem(filePath,name,false);
		}
		// console.log(7777,$images,itemsArr);
		return {items:itemsArr,index:index};
	};
	
	var initView = function(path,ext,name,photoSwipeTpl){
		var imageList = getImageArr(path,name);
		if($('.pswp_content').length == 0){
			$(photoSwipeTpl).appendTo('body');
			$('.pswp__caption__center').css({"text-align":"center"});
		}
		if($('.pswp').hasClass('pswp--open')) return;
		var options = {
			focus: true,
			index: 0,
			bgOpacity:0.8,
			maxSpreadZoom:5,
			closeOnScroll:false,
			shareEl: false,
			showHideOpacity:false,
			showAnimationDuration: 300,
			hideAnimationDuration: 500,
			fullscreenEl : true,
			history:false,
			preload:[1,5],
			getThumbBoundsFn: function(index) {
				var item = imageList.items[index];
				if(!item || !item.$dom || item.$dom.length == 0){//目录切换后没有原图
					return {x:$(window).width()/2,y:$(window).height()/2,w:1,h:1};
				}
				var pageYScroll = window.pageYOffset || document.documentElement.scrollTop; 
				var rect = $(item.$dom).get(0).getBoundingClientRect();
				rect = {width:rect.width,height:rect.height,left:rect.left,top:rect.top};
				
				// 图片没有完全显示时(相册模式,高宽固定,定宽定高,超出从中间截取)
				if(rect.width == rect.height){
					var width  = parseInt(item.$dom.attr('img-width'));
					var height = parseInt(item.$dom.attr('img-height'));
					var boxSize = rect.width;
					if(height > width){
						rect.height = (rect.width * height) / width; //重新计算高度; 保持比例不变;
						rect.top  = rect.top - (rect.height - boxSize) / 2; //图片取中间后上面偏移;
					}else{
						rect.width = (rect.height * width) / height; //重新计算高度; 保持比例不变;
						rect.left  = rect.left - (rect.width - boxSize) / 2; //图片取中间后左侧偏移;
					}
				}
				// console.log(102,__json(rect));
				return {
					x:rect.left || 0,
					y:rect.top + pageYScroll,
					w:rect.width,
					h:rect.height
				};
			}
		};
		options.index = imageList.index;
		var gallery = new PhotoSwipe($('.pswp').get(0),PhotoSwipeUI_Default,imageList.items,options);
		gallery.loadFinished = false;
		gallery.listen('gettingData', function(index, item) {
			if (item.w < 1 || item.h < 1) {
				var img = new Image(); 
				img.onload = function() {
					item.w = this.width;
					item.h = this.height;
					gallery.updateSize(true);
				}
				img.src = item.src;
			}

			//打开图片，加载动画起始位置
			if(!gallery.loadFinished){
				var rect = options.getThumbBoundsFn(index);
				item.w = rect.w * 25;
				item.h = rect.h * 25;
				gallery.loadFinished = true;
				// console.log(123123,item,rect);
			}
		});
		gallery.listen('close', function(){
			setTimeout(function(){
				$(gallery.container).find('.pswp__zoom-wrap').fadeOut(200);
			},300);
		});
		gallery.init();
		
		// 解决滚动穿透问题;(UC,内嵌网页等情况)
		$(".pswp__bg").scrollTop($(".pswp__bg").scrollInnerHeight() / 2);
	};
	
	
	var bindCloseTag = false;
	var bindClose = function(){
		if(bindCloseTag) return;
		bindCloseTag = true;
		$(document).delegate('.pswp__item','touchend',function(e){
			var needClose = !$(e.target).existParent('.pswp__zoom-wrap');
			if(needClose){
				$(".pswp__button--close").trigger("click");
			}

			setTimeout(function(){
				$(".pswp__bg").scrollTop($(".pswp__bg").scrollInnerHeight() / 2);
			},10);
		});
	}

	//http://dimsemenov.com/plugins/royal-slider/gallery/
	//http://photoswipe.com/documentation/faq.html
	return function(path,ext,name,appStatic,appStaticDefault){
		requireAsync([
			appStaticDefault+'PhotoSwipe/photoSwipe.html',
			appStatic+'PhotoSwipe/photoswipe.min',
			appStatic+'PhotoSwipe/photoswipe-ui-default.min',
			appStatic+'PhotoSwipe/photoswipe.css',
			appStatic+'PhotoSwipe/default-skin/default-skin.css',
		],function(photoSwipeTpl){
			bindClose();
			initView(path,ext,name,photoSwipeTpl);
		});
	};
});