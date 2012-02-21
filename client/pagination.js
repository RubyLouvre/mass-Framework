$.define("pagination","event,attr",function(){
    var defaults = {
        show_last: true,
        show_first:true,
        show_prev: true,
        show_next: true,
        prev_class: "prev_page",
        next_class: "next_page",
        first_text: "<<",
        last_text: ">>",
        next_text: "下一页&gt;",
        prev_text: "上一页&gt;",
        curr_page:0,
        per_page: 10,
        show_pages:10,
        fill_text:"...",
        show_jump:false
    }
    function createPg(tag, cls, text, index){
        return tag ?  ('<' + tag +' class="'+cls+   (tag == "a" ? ' href="page=' + index +'">' : '>') + text + "</"+tag+">")  : text
    }
    var Pager = $.factory({
        init:function(total, option){
            if( isFinite(total) ){
                this.total = total;
            }else{
                throw "第一个参数必须是一个正整数"
            }
            var opt = $.Object.merge({},defaults,option || {});
            for(var i in opt){
                this[i] = opt[i]
            }
        },
        render: function(){
            this.total_pages = Math.ceil( this.total / this.per_page);//计算总页数
            this.show_pages = Math.min(this.show_pages, this.total_pages);
            var curr = this.curr_page
            curr =   this.curr_page = curr < 0 ? 0 : curr > this.total_pages ? this.total_pages : curr;
            //一共有多少页，要显示多少页出来，当前是多少页
            var left = Math.floor( this.show_pages/2 );
            var html = ['<div class="mass_page">']

            /*上一页*/
            if(curr > 0 && this.show_prev){
                html.push(createPg("a", this.prev_class, this.prev_text, curr- 1));
            }
            /*第一页*/
            if(curr > 0 && curr > left && this.show_first && this.show_pages != this.total_pages){
                html.push(createPg("a", "", this.first_text || 0, 0 ));
            }

            var i = 0, lefti = 0;
            if(curr > left){
                if(this.first_text && curr != left + 1 && this.show_pages != this.total_pages && this.show_pages !== 0){
                    html.push(createPg("span", "", this.fill_text , 0));
                }
                i = Math.min(curr - left, this.total_pages - this.show_pages);
            }
            while(i < curr){
                 html.push(createPg("a", "", ++i, 0 ));
                lefti++;
            }
            if(this.showOut !== 0){
                htmlObj['list'] += this._pnItemHtml(this.nowPn +1 , 'em');
            }
            var righti = this.showOut - 1 - lefti;
            if(this.nowPn < this.totalPages-1){
                for(var i2 = 1; i2 <= righti;){
                    htmlObj['list'] += this._pnItemHtml(this.nowPn + ++i2, (this.nowPn + i2 -1)+this.startPn);
                }
            }
            if(this.nowPn + righti < this.totalPages-1){
                if(this.lastText && this.nowPn + 1 != this.totalPages - (this.showOut - showOutLeft) && this.showOut !== 0){
                    htmlObj['list'] += this._pnItemHtml('...', 'span');
                }
            }

            /*最后一页*/
            if(this.nowPn < this.totalPages - (this.showOut - showOutLeft) && this.lastText != null && this.showOut != this.totalPages){
                htmlObj['last'] += this._pnItemHtml(this.lastText, (this.totalPages-1)+this.startPn, 'pager-last');
            }
            /*下一页*/
            if(this.nowPn < this.totalPages-1 && this.netxText != null){
                htmlObj['next'] += this._pnItemHtml(this.netxText, this.nowPn + this.startPn + 1, 'pager-next');
            }
            if(this.curr_page > 0){
            //显示上一页
            }
            if(this.curr_page < 0){
        //显示上一页
        }
        }
    });
    //show_last
    //show_first
    //show_prev
    //show_next
    //per_page 每页显示多少个
    //show_num : 10
    //fill_text: "...
    //disabled_class: 'disabled-button', // class for disabled prev or next button
    //current_lass: 'current-button',

    $.fn.pagination = function(total, opt){
        var page = new Pager(total, opt);
        $(this[0]).append(page.target)
    
    }


})
/*
 * 翻页组件
*/

(function(){
	var mix = QW.ObjectH.mix,
		queryUrl = QW.StringH.queryUrl,
		encodeURIJson = QW.ObjectH.encodeURIJson,
        createEvents = QW.CustEvent.createEvents
	/*
	* 构造函数
	*/
	function Pager(pagerWrapEl, opts){
		this.pagerWrapEl = pagerWrapEl || '.pager-wrap';
		mix(this, mix({
			pn        : 'pn',       //页面的query参数
			//qsize      : 'size',     //页面的size参数
			//qoffset    : 'offset',   //页面的offset参数
			total     : 1,          //总条数
			size      : 10,         //每页条数
			offset    : 0,          //当前页面起始条
			preText   : '上一页',   //“上一页”链接文字，为null时不显示
			netxText  : '下一页',   //“下一页”链接文字，为null时不显示
			firstText : '第一页',   //“第一页”链接文字，为null时不显示
			lastText  : '最后一页', //“最后一页”链接文字，为null时不显示，为'last'时显示最后一页页码
			hasForm   : false,      //是否显示可输入页码跳转
			pgFormBtn : 'Go',       //输入页面表单按钮文字，为null时不显示
			startPn   : 0,          //计数起始值
			showOut   : 8            //展示出来的页码条数,为'all'时展示所有
		}, opts, true));
		/*页面翻页部分结构顺序*/
		this.layout = ['pre', 'first', 'list', 'last', 'next'];
		this._init();
	}

	var PAGER_EVENTS_DEFAULT = ['go', 'back', 'next', 'first', 'last'];

	/*
     * 成员方法
     */
	mix(Pager.prototype, {
		/*
		* 初始化
		*/
		_init : function(){
			this.wrapEl = W(this.pagerWrapEl);
			this.pagers = W('.pager', this.wrapEl).length > 0 ? W(W('.pager', this.wrapEl)) : W('<div class="pagers"></div>');
			var queryObj = queryUrl(window.location.search);
			/*处理pn or offset*/
			if(this.qsize != undefined && this.qoffset != undefined){
				this.startPn = 1;
				if(!queryObj[this.qsize]){
					this.givenPn = 0;
				} else {
					mix(this,{
							offset : queryObj[this.qoffset] |0,
							size   : queryObj[this.qsize] |0
						}, true);
					this.givenPn = Math.ceil(this.offset / this.size);
				}
			} else {
				var givenPn = (queryObj[this.pn] || this.startPn) | 0;
			}
			/*总页码数*/
			this.totalPages = this.totalPages || Math.ceil(this.total/this.size);
			this.lastText = this.lastText == 'last' ? this.totalPages : this.lastText;
			this.showOut = this.showOut == 'all' ? this.totalPages : this.showOut;
			this.showOut = Math.min(this.showOut, this.totalPages);
			/*当前页码数*/
			this.givenPn = this.givenPn == undefined ? Math.min(Math.max(givenPn, this.startPn), this.totalPages -1 + this.startPn) : this.givenPn;
			this.nowPn = this.nowPn === 0 ? this.nowPn : (this.nowPn ||  (this.givenPn - this.startPn));
			/*页码结构各部分父元素的className*/
			this.wrapEls = mix({
				first : 'pager-first', //第一页
				back  : 'pager-back',  //上一页
				next  : 'pager-next',  //下一页
				last  : 'pager-last',  //最后一页
				i     : 'pager-i',     //页码
				f     : 'pager-f'      //表单
			}, this.wraps, true);

			createEvents(this, PAGER_EVENTS_DEFAULT);

			return this;
		},

		/*
		* 创建翻页html片段
		*/
		_createHtml : function(){
			var html = '',
				htmlObj = {};

			this.layout.forEach(function(e){
					htmlObj[e] = '';
				}
			);

			var showOutLeft = Math.floor(this.showOut/2);
			/*上一页*/
			if(this.nowPn > 0 && this.preText != null){
				htmlObj['pre'] += this._pnItemHtml(this.preText, this.nowPn + this.startPn - 1, 'pager-back');
			}
			/*第一页*/
			if(this.nowPn > 0 && this.nowPn > showOutLeft && this.firstText != null && this.showOut != this.totalPages){
				htmlObj['first'] += this._pnItemHtml(this.firstText, this.startPn, 'pager-first');
			}

			var i = 0, lefti = 0;
			if(this.nowPn > showOutLeft){
				if(this.firstText && this.nowPn != showOutLeft + 1 && this.showOut != this.totalPages && this.showOut !== 0){
					htmlObj['list'] += this._pnItemHtml('...', 'span');
				}
				i = Math.min(this.nowPn - showOutLeft, this.totalPages - this.showOut);
			}
			while(i < this.nowPn){
				htmlObj['list'] += this._pnItemHtml(++i, (i-1)+this.startPn);
				lefti++;
			}
			if(this.showOut !== 0){
				htmlObj['list'] += this._pnItemHtml(this.nowPn +1 , 'em');
			}
			var righti = this.showOut - 1 - lefti;
			if(this.nowPn < this.totalPages-1){
				for(var i2 = 1; i2 <= righti;){
					htmlObj['list'] += this._pnItemHtml(this.nowPn + ++i2, (this.nowPn + i2 -1)+this.startPn);
				}
			}
			if(this.nowPn + righti < this.totalPages-1){
				if(this.lastText && this.nowPn + 1 != this.totalPages - (this.showOut - showOutLeft) && this.showOut !== 0){
					htmlObj['list'] += this._pnItemHtml('...', 'span');
				}
			}

			/*最后一页*/
			if(this.nowPn < this.totalPages - (this.showOut - showOutLeft) && this.lastText != null && this.showOut != this.totalPages){
				htmlObj['last'] += this._pnItemHtml(this.lastText, (this.totalPages-1)+this.startPn, 'pager-last');
			}
			/*下一页*/
			if(this.nowPn < this.totalPages-1 && this.netxText != null){
				htmlObj['next'] += this._pnItemHtml(this.netxText, this.nowPn + this.startPn + 1, 'pager-next');
			}

			//html.push('</p>');

			/*可输入表单*/
			var formHtml = '';
			if(this.hasForm){
				formHtml += '<form class="pager-f">';
				formHtml += '<fieldset><legend>跳转到页码</legend><p>';
				formHtml += '第<input size="' + (this.totalPages + '').length + '" name="' + this.pn + '">页';
				formHtml += '<button type="submit">' + this.pgFormBtn + '</button>';
				formHtml += '</p></fieldset></form>';
			}

			html += '<p class="pager-i">';
			this.layout.forEach(function(e){
					html += htmlObj[e];
				}
			);
			html += formHtml;

			return html;
		},

		_pnUrl : function(pn){
			var queryObj = queryUrl(window.location.search);
			if(this.qsize != undefined && this.qoffset != undefined){
				queryObj[this.qsize] = this.size;
				queryObj[this.qoffset] = this.size * pn;
				delete queryObj[this.pn];
			} else {
				queryObj[this.pn] = pn;
			}
			return encodeURIJson(queryObj);
		},

		_pnItemHtml : function(text, i, classname){
			if(typeof(i) == 'string'){
				return QW.StringH.format('<{1}><span class="{2}">{0}</span></{1}>', text, i, classname);
			}
			return QW.StringH.format('<{3} href="{1}" class="{2}"><span>{0}</span></{3}>', text, '?' + this._pnUrl(i), classname, 'a');
		},

		_retouch_action : function(e, pn){
			var instance = this;
			var needRetouch = ['first', 'back', 'next', 'last'];
			var ret = true;
			var t = needRetouch.forEach(function(v){
				if(W(e.target).hasClass(instance.wrapEls[v]) || (W(e.target).parentNode('a').length && W(e.target).parentNode('a').hasClass(instance.wrapEls[v]))){
					if(!instance.fire(v, {i : pn})){
						e.preventDefault();
						ret = false;
					}
				}
			});
			return ret;
		},

		_action : function(){
			var instance = this;
			var pagers_i_a = '.' + this.wrapEls.i + '>a',
				pager_f = '.' + this.wrapEls.f;
			this.wrapEl.delegate(pagers_i_a, 'click', function(e){
				var searchObj = queryUrl(W(this).attr('href').split('?')[1]);
				if(instance.qoffset != undefined && instance.qsize != undefined){
					var pn = Math.ceil(searchObj[instance.qoffset]/searchObj[instance.qsize]);
				} else {
					var pn = searchObj[instance.pn] - instance.startPn;
				}
				if(instance._retouch_action(e, pn)){
					if(!instance.fire('go', {i : pn})){
						e.preventDefault();
					}
				}
			});
			this.wrapEl.delegate(pager_f, 'submit', function(e){
				var gp = e.target[instance.pn].value | 0;
				var i = Math.min(instance.totalPages, Math.max(0, gp - instance.startPn));
				e.target[instance.pn].value = Math.max(instance.startPn, gp - 1 + instance.startPn);
				if(!instance.fire('go', {i : i})){
					e.preventDefault();
				}
			});
		},

		render : function(rerender){
			if(rerender) {
				this.wrapEl.html(this._createHtml());
			} else if(W('.pagers', this.wrapEl).length == 0){
				W(this.pagers).html(this._createHtml());
				this.wrapEl.appendChild(this.pagers);
			}
			this._action();
		},

		/*
		* 到某一页
		*/
		go : function(i){
			i = Math.min(this.totalPages, Math.max(0, i));
			if(!this.fire('go', {i : i})){
				return false;
			} else if(this.nowPn != i && window.location.search) {
				window.location.search = this._pnUrl(i + this.startPn);
			}
		},

		/*
		* 到第一页
		*/
		first : function(){
			if(this.nowPn > 0 && this.fire('first', {i : 0})){
				return this.go(0);
			}
			return false;
		},

		/*
		* 到最后一页
		*/
		last : function(){
			if(this.nowPn < this.totalPages -1 && this.fire('last', {i : this.totalPages - 1})){
				return this.go(this.totalPages - 1);
			}
			return false;
		},

		/*
		* 往前一页
		*/
		back : function(){
			if(this.nowPn > 0 && this.fire('back', {i : this.nowPn - 1})){
				return this.go(this.nowPn - 1);
			}
			return false;
		},

		/*
		* 往后一页
		*/
		next : function(){
			if(this.nowPn < this.totalPages -1 && this.fire('next', this.nowPn + 1)){
				return this.go(this.nowPn + 1);
			}
			return false;
		}
	});

	/*向QWrap输出Pager*/
	QW.provide('Pager', Pager);

	/*添加到W的方法上去*/
	var PagerH = {
		Pager : function(pagerWrapEl, opts){
			new Pager(pagerWrapEl, opts).render();
		}
	}
	QW.NodeW.pluginHelper(PagerH, 'operator');
})();