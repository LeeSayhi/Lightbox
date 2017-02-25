;(function($) {

	// 先申明，（构造函数）
	var LightBox = function(settings) {
		var that = this;

		this.settings = {
			speed: 500,
		}
		$.extend(this.settings, settings || {})

		// 创建遮罩和弹出框（封装成jQuery对象)
		this.popupMask = $('<div id="G-lightbox-mask">');  // 遮罩
		this.popupWin = $('<div id="G-lightbox-popup">'); // 弹出框
		// 保存body
		this.bodyNode = $(document.body);
		// 渲染剩余的DOM，并且插入到body
		this.randerDOM();

		this.picViewArea = this.popupWin.find("div.lightbox-pic-view");  // 图片预览区域
		this.popupPic = this.popupWin.find("img.lightbox-image"); // 图片
		this.nextBtn = this.popupWin.find("span.lightbox-next-btn");
		this.prevBtn = this.popupWin.find("span.lightbox-prev-btn");
		this.picCaptionArea = this.popupWin.find("div.lightbox-pic-caption"); // 图片描述区域
		this.captionText = this.popupWin.find("p.lightbox-pic-desc"); // 图片描述
		this.currentIndex = this.popupWin.find("span.lightbox-of-index"); // 当前索引
		this.closeBtn = this.popupWin.find("span.lightbox-close-btn"); // 关闭按钮

		this.groupName = null;  // 定义组名
		this.groupDate = [];   // 存贮同组数据
		// 准备开发时间委托，获取组数据（委托到body）
		this.bodyNode.delegate(".js-lightbox , *[data-role=lightbox]","click",function(){
			var currentGroupName = $(this).attr("data-group");  // 当前点击的组名
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


	// 函数的原型（用来封装方法）
	LightBox.prototype = {

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

			this.index = this.getIndexOf(sourceId);  // 根据当前点击的元素ID获取在当前组别里的索引
			// 判断图片在数组中的位置添加或取消class="disabled"
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
			// 如果图片的宽高大于浏览器适口的宽高比例，看看是否溢出
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
				that.flag = true;   // 点击切换按钮等所有东西都加载完之后切换图片（以防高频率点击出现bug）
				that.clear = true;
			});
			// 设置描述文字和当前索引
			this.captionText.text(this.groupDate[this.index].caption);
			this.currentIndex.text("当前索引: "+(this.index+1)+ " of " +this.groupDate.length);
		},

		// 监控图片是否加载完成（图片预加载）
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

		// 获取数组数据
		getGroup: function() {
			var that = this;
			// 根据当前的组别名称获取页面中所有相同组别的对象
			var groupList = this.bodyNode.find("*[data-group="+this.groupName+"]");
			that.groupDate.length = 0;  // 添加前先清空数组数据
			groupList.each(function() {
				that.groupDate.push({
					src: $(this).attr("data-source"),
					id: $(this).attr("data-id"),
					caption: $(this).attr("data-caption"),
				})
			});
		},

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

			// 插入到popupWin（弹出框）
			this.popupWin.html(strDom);
			// 把遮罩和弹出框插入到body中
			this.bodyNode.append(this.popupMask, this.popupWin);			
		}
	};

	window['LightBox']=LightBox;

})(jQuery);