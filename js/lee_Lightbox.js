;(function($) {

	var LightBox = function(settings) {
		var that = this;

		this.settings = {
			speed: 500,
		}
		$.extend(this.settings, settings || {});

		// 遮罩和弹出框
		this.popupMask = $('<div id="G-lightbox-mask">');  
		this.popupWin = $('<div id="G-lightbox-popup">'); 

		this.bodyNode = $(document.body);
		// 渲染DOM
		this.randerDOM();

		this.picViewArea = this.popupWin.find("div.lightbox-pic-view");  
		this.popupPic = this.popupWin.find("img.lightbox-image"); 
		this.nextBtn = this.popupWin.find("span.lightbox-next-btn");
		this.prevBtn = this.popupWin.find("span.lightbox-prev-btn");
		this.picCaptionArea = this.popupWin.find("div.lightbox-pic-caption"); 
		this.captionText = this.popupWin.find("p.lightbox-pic-desc"); 
		this.currentIndex = this.popupWin.find("span.lightbox-of-index"); 
		this.closeBtn = this.popupWin.find("span.lightbox-close-btn"); 

		this.groupName = null;  // 组名
		this.groupDate = [];   // 存贮同组数据

		this.bodyNode.delegate(".js-lightbox , *[data-role=lightbox]","click",function(){
			var currentGroupName = $(this).attr("data-group");  
			if (currentGroupName != that.groupName) {
				that.groupName = currentGroupName;
				// 根据当前组名获取同一组数据
				that.getGroup();
			};

			// 初始化弹框
			that.initPopup($(this));
		})

		//  关闭弹框
		this.popupMask.click(function() {
			$(this).fadeOut();
			that.popupWin.fadeOut();
			that.clear = false;
		});
		this.closeBtn.click(function() {
			that.popupMask.fadeOut();
			that.popupWin.fadeOut();
			that.clear = false;
		});

		// 上下切换按钮事件
		this.flag = true; 
		this.nextBtn.hover(function() {
			if (!$(this).hasClass("disabled") && that.groupDate.length>1) {
				$(this).addClass("lightbox-next-btn-show");
			}
		},function() {
			if (!$(this).hasClass("disabled") && that.groupDate.length>1) {
				$(this).removeClass("lightbox-next-btn-show");
			}
		}).click(function(e) {
			if (!$(this).hasClass("disabled") && that.flag) {
				that.flag = false;
				e.stopPropagation();
				that.goto("next");
			}
		});
		this.prevBtn.hover(function() {
			if (!$(this).hasClass("disabled") && that.groupDate.length>1) {
				$(this).addClass("lightbox-prev-btn-show");
			}
		}, function() {
			if (!$(this).hasClass("disabled") && that.groupDate.length>1) {
				$(this).removeClass("lightbox-prev-btn-show");
			}
		}).click(function(e) {
			if (!$(this).hasClass("disabled") && that.flag) {
				that.flag = false;
				e.stopPropagation();
				that.goto("prev");
			}
		})

		// 窗口调整事件
		var timer = null;
		this.clear = false;
		$(window).resize(function() {
			if (that.clear) {
				window.clearTimeout(timer)
				timer = window.setTimeout(function(){
					that.loadPicSize(that.groupDate[that.index].src);
				},300)
			}	
		})
		// 键盘事件
		$(window).keyup(function(e) {
		//	console.log(e.which);
			if (that.clear) {
				if (e.which == 38 || e.which == 37) {
				that.prevBtn.click();
				}
				if (e.which == 40 || e.which == 39) {
					that.nextBtn.click();
				}
			}
		})
	};


	LightBox.prototype = {

		// 渲染DOM结构
		randerDOM: function() {
			var strDom = '<div class="lightbox-pic-view">'+
							'<span class="lightbox-btn lightbox-prev-btn"></span>'+
							'<img class="lightbox-image" src="img/1-1.jpg">'+
							'<span class="lightbox-btn lightbox-next-btn"></span>'+
						'</div>'+
						'<div class="lightbox-pic-caption">'+
							'<div class="lightbox-caption-area">'+
								'<p class="lightbox-pic-desc"></p>'+
								'<span class="lightbox-of-index">当前索引：0 of 0</span>'+
								'<span class="lightbox-close-btn"></span>'+
							'</div>'+
						'</div>';
			this.popupWin.html(strDom);
			this.bodyNode.append(this.popupMask, this.popupWin);			
		},

		// 获取数组数据
		getGroup: function() {
			var that = this;
			var groupList = this.bodyNode.find("*[data-group="+this.groupName+"]");
			that.groupDate.length = 0;  
			groupList.each(function() {
				that.groupDate.push({
					src: $(this).attr("data-source"),
					id: $(this).attr("data-id"),
					caption: $(this).attr("data-caption"),
				})
			});
		},		

		// 初始化弹框
		initPopup: function(currentObj) {
			var sourceSrc = currentObj.attr("data-source");
			var sourceId = currentObj.attr("data-id");

			this.showMaskAndPopup(sourceSrc, sourceId);

		},

		// 显示遮罩层和弹出框
		showMaskAndPopup: function(sourceSrc, sourceId) {
			var that = this;
			this.popupPic.hide();
			this.picCaptionArea.hide();
			this.popupMask.fadeIn();

			var winWidth = $(window).width();
			var winHeight = $(window).height();
			this.picViewArea.css({
				width: winWidth/2,
				height: winHeight/2,
			})

			this.popupWin.fadeIn();
			this.popupWin.css({
				width: winWidth/2 + 10,
				height: winHeight/2 + 10,
				marginLeft: -(winWidth/2 + 10)/2,
				top: -(winHeight/2 + 10),
			}).animate({
				top: (winHeight/2 + 10)/2
			}, that.settings.speed, function() {
				// 加载图片
				that.loadPicSize(sourceSrc);

			});

			this.index = this.getIndexOf(sourceId);  

			var groupDateLength = this.groupDate.length;
			if (groupDateLength > 1) {
				if (this.index === 0 ) {
					this.prevBtn.addClass("disabled");
					this.nextBtn.removeClass("disabled");
				}
				else if(this.index === groupDateLength-1) {
					this.nextBtn.addClass("disabled");
					this.prevBtn.removeClass("disabled");
				}
				else {
					this.nextBtn.removeClass("disabled");
					this.prevBtn.removeClass("disabled");
				}
			};
		},

		// 根据当前点击的元素ID获取在当前组别里的索引
		getIndexOf: function(sourceId) {
			var index = 0;
			$(this.groupDate).each(function(i) {
				index = i;
				if (this.id === sourceId) {
					return false;
				};
			});
			return index;
		},

		// 预加载图片
		preLoadImg: function(sourceSrc, callback) {
			var img = new Image();
			img.src = sourceSrc;
			if (!!window.ActiveXObject) {  // IE
				img.onreadystatechange = function() {
					if (this.readyState == "complete") {
						callback();
					};
				}
			}
			else{  // 其他
				img.onload = function() {
					callback();
				}
			}
		},
		// 加载图片
		loadPicSize: function(sourceSrc) {
			var  that = this;

			this.popupPic.css({
				width: "auto",
				height: "auto",
			}).hide();

			this.picCaptionArea.hide();

			this.preLoadImg(sourceSrc, function() {
				that.popupPic.attr('src',sourceSrc);
				var picWidth = that.popupPic.width();
				var picHeight = that.popupPic.height();

				that.changePic (picWidth, picHeight);
			});
		},
		// 改变图片
		changePic: function(width, height) {
			var that = this;
			var winWidth = $(window).width();
			var winHeight = $(window).height();
			// 如果图片的宽高大于浏览器适口的宽高比例
			var scale = Math.min(winWidth/(width+10), winHeight/(height+10), 1)
			width = width*scale;
			height = height*scale;

			this.picViewArea.animate({
				width: width-10,
				height: height-10,
			}, that.settings.speed);
			this.popupWin.animate({
				width: width,
				height: height,
				marginLeft: -(width/2),
				top: (winHeight - height)/2
			}, that.settings.speed, function() {
				that.popupPic.css({
					width: width-10,
					height: height-10,
				}).fadeIn();
				that.picCaptionArea.fadeIn();
				that.flag = true;   
				that.clear = true;
			});

			this.captionText.text(this.groupDate[this.index].caption);
			this.currentIndex.text("当前索引: "+(this.index+1)+ " of " +this.groupDate.length);
		},

		// 切换按钮事件
		goto: function(dir) {
			if (dir === "next") {
				this.index++;
				if (this.index >= this.groupDate.length-1) {
					this.nextBtn.addClass("disabled").removeClass("lightbox-next-btn-show");
				}
				if (this.index != 0) {
					this.prevBtn.removeClass("disabled");
				}

				var src = this.groupDate[this.index].src;
				this.loadPicSize(src);
			}
			else if (dir === "prev") {
				this.index--;
				if (this.index <= 0) {
					this.prevBtn.addClass("disabled").removeClass("lightbox-prev-btn-show");
				}
				if (this.index != this.groupDate.length-1) {
					this.nextBtn.removeClass("disabled");
				}

				var src = this.groupDate[this.index].src;
				this.loadPicSize(src);
			}
		},
	};

	window['LightBox']=LightBox;

})(jQuery);