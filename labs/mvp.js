(function(){
    sb_ie&&sj_evt.bind("onP1",function(){
        sj_jb("UpdateDefaults",0)
        },1,1)
    })();function setCW(){
    sj_cook.set("_SS","CW",sj_b.clientWidth),sj_cook.set("_SS","CH",sb_de.clientHeight)
    }sj_be(_w,"load",setCW),sj_be(_w,"resize",setCW);  _scopeUrls['images']='/images/search?q=&amp;FORM=BILH'; _scopeUrls['video']='/videos/search?q=&amp;FORM=BVLH'; _scopeUrls['commerce']='/shopping/search?q=&amp;mkt=zh&amp;FORM=BPLH'; _scopeUrls['news']='/news/search?q=&amp;FORM=BNLH'; _scopeUrls['local']='/maps/default.aspx?q=&amp;mkt=zh&amp;FORM=BYLH'; _scopeUrls['travel']='/travel?FORM=ZZLH'; _scopeUrls['entertainment']='/entertainment?FORM=ZZLH1'; _scopeUrls['history']='/profile/history?FORM=ZZLH2';var _scopeRef = new Array; _scopeRef['images']='0'; _scopeRef['video']='1'; _scopeRef['commerce']='2'; _scopeRef['news']='3'; _scopeRef['local']='4'; _scopeRef['travel']='5'; _scopeRef['entertainment']='6'; _scopeRef['history']='7';var _scpIID = 'SERP.1000'; ;var sc_Popup=1;sj_jb(typeof _G!="undefined"&&_G.RTL===!0?"ScopePopup2_rtl":"ScopePopup2");HPV_er=function(n,t){
    typeof HP_Er=="function"&&HP_Er(n,t,"HPV")
    };var VM=new function(){
    function nt(n){
        n.style.display="block"
        }function f(n){
        n.style.display="none"
        }function s(){
        nt(i),f(e)
        }function p(){
        f(i),nt(e)
        }function rt(){
        s(),n.pause()
        }function ut(){
        r===!0&&(p(),n.play())
        }function b(n){
        var i=n?sj_be:sj_ue;tt?(y(),i(_d,t,y),i(_w,"unload",it)):(i(_w,"blur",rt),i(_w,"focus",ut))
        }function y(){
        _d[u]?n.pause():r===!0&&n.play()
        }function it(){
        sj_ue(_d,t,y)
        }var g="hidden",o="Hidden",h="visibilitychange",w="undefined",v="ms",l="webkit",n,i=_ge("sh_pl"),e=_ge("sh_ps"),k,d,u,t,r,tt,c,a;this.Loaded=!1,this.Request=!0,this.InFoc=1,r=!0,tt=function(){
        if(typeof _d[g]!==w)u=g,t=h;else if(typeof _d[v+o]!==w)u=v+o,t=v+h;else if(typeof _d[l+o]!==w)u=l+o,t=l+h;else return!1;return!0
        }(),i&&(c=i.parentNode,a=e.parentNode,sj_be(c,"click",function(){
        a.focus()
        }),sj_be(a,"click",function(){
        c.focus()
        })),this.Constants={
        VideoWidth:"956",
        VideoHeight:"512"
    },this.hideControls=function(){
        f(i),f(e),b(!1)
        },this.end=function(){
        s()
        },this.play=function(){
        try{
            VM.Request=!1,p(),n.play(),r=!0
            }catch(t){
            HPV_er(t,"play")
            }
        },this.pause=function(){
        try{
            VM.Request=!1,s(),n.pause(),r=!1
            }catch(t){
            HPV_er(t,"pause")
            }
        },this.fade=function(){
        try{
            !VM.Loaded&&VM.InFoc&&(n.play(),sj_fader().init(n,0,100,2),p(),VM.Loaded=!0,typeof HPV_lat=="function"&&(d=sb_gt()-k,HPV_lat(d))),sj_evt.fire("onRBComplete")
            }catch(t){
            HPV_er(t,"fade")
            }
        },this.sa_vid_ld=function(t){
        var r,i;try{
            if(n=_ge("vid"),VM.Loaded||!_w.g_vid||!n)return;for(r=_w.g_vid,sj_be(n,"canplaythrough",t||VM.fade),sj_so(n,0),n.width=VM.Constants.VideoWidth,n.height=VM.Constants.VideoHeight,i=0;i<r.length;i++)if(!!(n.canPlayType&&n.canPlayType(r[i][0]).match(/^(probably|maybe)$/i))){
                n.type=r[i][0],n.src=r[i][1],k=sb_gt();break
            }b(!0)
            }catch(u){
            HPV_er(u,"Load")
            }
        }
    };sj_evt.bind("onBgSet",function(){
    VM.Loaded===!1&&VM.sa_vid_ld()
    },1),sj_be(_w,"beforeunload",function(){
    VM.Request||(VM.Request=!0)
    },!1);var g_vid =[["video\/ogg; codecs=\"theora, vorbis\"","\/az\/hprichv\/?p=Africa_framepool_604-942-833-512_EN-US.ogv"],["video\/mp4; codecs=\"avc1.42E01E, mp4a.40.2\"","\/az\/hprichv\/?p=Africa_framepool_604-942-833-512_EN-US.mp4"]];;var g_hot={
    1:{
        0:"Until elephants start walking on stilts…",
        1:"You\'re looking at the tallest living creature on Earth"
    },
    2:{
        0:"What do these long-legged land lubbers look like when they\'re getting a drink?",
        1:"Funny, that\'s what"
    },
    3:{
        0:"Across the animal kingdom, there\'s one thing that\'s certain:",
        1:"Don\'t mess with baby when mama\'s around"
    },
    4:{
        0:"Conservation of wildlife habitat is just one issue facing representatives of this diverse continent as they come together for meetings this week.",
        1:"But today, they celebrate nearly half a century of unity and achievement"
    }
    };;function fadeComplete(){
    var i,r,u,n,t;_G.KPT=new Date,i="className",g_bgStyle.drk||(_ge("hp_sw_content").firstChild[i]="sw_sform lit"),r=_ge("pi"),r&&(r[i]+=g_bgStyle.top),_ge("sc_hs1")&&sj_jb("homepage2Hotspots_c"),u=_ge("sw_filt"),u||(n=_ge("sb_sl"),t=_ge("sb_form"),n&&t&&(n.style.width=t.offsetWidth+"px",n.style.display="block")),g_hasVid||sj_evt.fire("onRBComplete")
    }sc_fadeCb=fadeComplete;g_bgStyle={
    drk:1,
    top:' sc_light',
    bot:' sc_light'
};g_img={
    url:'/az/hprichv/?p=Africa_framepool_604-942-833-512_EN-US52756876.jpg'
};fadeComplete();;var hpl={
    ref:{
        ssd:'20120525_0700',
        FORM:'HPFBLK',
        mkt:'en-US'
    },
    dt:false,
    sl:true
};sj_jb("homepageLike_c");;var g_prefetch ={};sj_evt.bind("onBgSet",function(){
    sj_jb("HPImgView3")
    },1);(function() {
    var events = 0;sj_evt.bind("onBgSet", WaitEvent, 1, 0);sj_evt.bind("onP1", function() {
        sj_jb("notifications", 1)
    }, 1, 0);sj_evt.bind("OnBnpLoaded", WaitEvent, 1, 0);function WaitEvent(){
        if (++events == 2) SendRequest()
            }function SendRequest(){
        if (typeof Bnp === 'undefined') return;if (Bnp.Global){
            Bnp.Global.RawRequestURL = "/?mkt=en-us";Bnp.Global.Referer = "http://weibo.com/jslouvre#1338007284477";
        }var request = new Bnp.Partner.Request("HomePage", "");request.IID = "SERP.2000";request.Submit();
    }
    })();;