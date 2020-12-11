var express = require('express');
var router = express.Router();
const async = require('async')

const urlencode = require('urlencode')
const moment = require('moment')
//const role = require('../../db/db_structure').role
const laboratory = require('../db/db_structure').laboratory//实验室
const laboratory_chief = require('../db/db_structure').laboratory_chief//实验室主任
const academic_committee = require('../db/db_structure').academic_committee//学术委员会
const research_directions = require('../db/db_structure').research_directions//研究方向
const xsjl = require('../db/db_structure').communication//研究方向
const news = require('../db/db_structure').news//新闻
const tzgg = require('../db/db_structure').notice//通知公告
const gzzd = require('../db/db_structure').regulations//规章制度
const zpxx = require('../db/db_structure').recruit//招聘信息
const sytp = require('../db/db_structure').index_pic//首页图片
const kyxm = require('../db/db_structure').project//科研项目
const qklw = require('../db/db_structure').periodical_article//期刊论文
const hylw = require('../db/db_structure').conference_article//会议论文
const xwlw = require('../db/db_structure').thesis//学位论文
const zz = require('../db/db_structure').treatise//专著
const hj = require('../db/db_structure').award//获奖
const zl = require('../db/db_structure').patent//专利
const user = require('../db/db_structure').user//用户
const role = require('../db/db_structure').role//角色
const user_role = require('../db/db_structure').user_role//用户角色
const project_achievement = require('../db/db_structure').project_achievement
const kfjjfj = require('../db/db_structure').fundfile//获奖
const zxcg = require('../db/db_structure').index_achievement 
const wzlj = require('../db/db_structure').relatedlink
const cgzs = require('../db/db_structure').software//成果展示
const yqsb = require('../db/db_structure').equipment//仪器设备
const yqsb_use = require('../db/db_structure').equipment_use//仪器设备
const kfjj = require('../db/db_structure').fundopen
const menu = require('../db/db_structure').menu

const bdsc_kycg = require('../db/db_structure').bdsc_kycg
/* GET manage home page. */
router.get('/', function(req, res, next) {
	//res.redirect('/spatial')
	//res.redirect('/spatial/manage/index')
	let data = {}
	async.waterfall([
		function(cb){
			//轮播图
			let search = sytp.find({})
				search.sort({'time':-1})
				search.limit(4)
				search.exec(function(error,docs){
					if(error){
						cb(error)
					}
					data.indexpic = docs //[]
					cb(null)
				})
		},
		function(cb){
			//实验室要闻
			let search = news.find({'showin':new RegExp('A')})
				search.sort({'id':-1})
				search.limit(3)
				search.exec(function(error,docs){
					if(error){
						cb(error)
					}
					data.news = docs //[]
					cb(null)
				})
		},
		function(cb){
			//研究平台
			let search = bdsc_kycg.find({'showin':new RegExp('B')})
				search.sort({'id':-1})
				search.limit(7)
				search.exec(function(error,docs){
					if(error){
						cb(error)
					}
					data.kycg = docs
					cb()
				})
		},
		function(cb){
			//通知公告
			let search = tzgg.find({})
				search.sort({'time':-1})
				search.limit(4)
				search.exec(function(error,docs){
					if(error){
						cb(error)
					}
					data.tzgg = docs
					cb()
				})
		}
	],function(error,result){
		if(error){
			console.log('getindexdata error',error)
			return res.json({'code':-1,'msg':error})
		}
		console.log('getindexdata success')
		return res.render('index',{title:'Express',indexpic:data.indexpic,news:data.news,kycg:data.kycg,tzgg:data.tzgg})
	})
    
});
//座位打印
router.get('/_print_',function(req,res){
	res.render('_print_')
})
//实验室简介
router.get('/lab',function(req,res){
	let search = laboratory.findOne({})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			res.render('lab',{data:doc,title:'实验室简介'})
		})
})
//新闻列表
router.get('/news',function(req,res){
	let page = req.query.page,
		limit = req.query.limit
	if(!page||typeof(page)=='undefined'){
		page = 1
	}
	if(!limit||typeof(limit)=='undefined'){
		limit = 15
	}
	let total = 0
	console.log('page,limit',page,limit)
	async.waterfall([
		function(cb){
			let search = news.find({'showin':new RegExp('A')}).count()
				search.exec(function(err,count){
					if(err){
						console.log('news get total err',err)
						cb(err)
					}
					console.log('news count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = news.find({'showin':new RegExp('A')})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('news error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log(error)
			return res.end(error)
		}
		//res.json({'data':result})
		return res.render('news',{'count':total,'page':page,'data':result,'title':'新闻'})
	})
})
//学术活动列表
router.get('/xshd',function(req,res){
	let page = req.query.page,
		limit = req.query.limit
	if(!page||typeof(page)=='undefined'){
		page = 1
	}
	if(!limit||typeof(limit)=='undefined'){
		limit = 15
	}
	let total = 0
	console.log('page,limit',page,limit)
	async.waterfall([
		function(cb){
			let search = xsjl.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('xsjl get total err',err)
						cb(err)
					}
					console.log('xsjl count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = xsjl.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('xsjl error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log(error)
			return res.end(error)
		}
		//res.json({'data':result})
		return res.render('xshd',{'count':total,'page':page,'data':result,'title':'学术活动'})
	})
})
//公告公示列表
router.get('/gggs',function(req,res){
	let page = req.query.page,
		limit = req.query.limit
	if(!page||typeof(page)=='undefined'){
		page = 1
	}
	if(!limit||typeof(limit)=='undefined'){
		limit = 15
	}
	let total = 0
	console.log('page,limit',page,limit)
	async.waterfall([
		function(cb){
			let search = tzgg.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('notice get total err',err)
						cb(err)
					}
					console.log('notice count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = tzgg.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('notice error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log(error)
			return res.end(error)
		}
		//res.json({'data':result})
		return res.render('gggs',{'count':total,'page':page,'data':result,'title':'公告公示'})
	})
})
//招贤纳士列表
router.get('/zxns',function(req,res){
	let page = req.query.page,
		limit = req.query.limit
	if(!page||typeof(page)=='undefined'){
		page = 1
	}
	if(!limit||typeof(limit)=='undefined'){
		limit = 15
	}
	let total = 0
	console.log('page,limit',page,limit)
	async.waterfall([
		function(cb){
			let search = zpxx.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('notice get total err',err)
						cb(err)
					}
					console.log('notice count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = zpxx.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('notice error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log(error)
			return res.end(error)
		}
		//res.json({'data':result})
		return res.render('zxns',{'count':total,'page':page,'data':result,'title':'招贤纳士'})
	})
})
//规章制度列表
router.get('/gzzd',function(req,res){
	let page = req.query.page,
		limit = req.query.limit
	if(!page||typeof(page)=='undefined'){
		page = 1
	}
	if(!limit||typeof(limit)=='undefined'){
		limit = 15
	}
	let total = 0
	console.log('page,limit',page,limit)
	async.waterfall([
		function(cb){
			let search = gzzd.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('gzzd get total err',err)
						cb(err)
					}
					console.log('noticgzzde count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = gzzd.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('notice error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log(error)
			return res.end(error)
		}
		//res.json({'data':result})
		return res.render('gzzd',{'count':total,'page':page,'data':result,'title':'规章制度'})
	})
})
//科研成果列表
router.get('/kycg',function(req,res){
	let page = req.query.page,
		limit = req.query.limit
	if(!page||typeof(page)=='undefined'){
		page = 1
	}
	if(!limit||typeof(limit)=='undefined'){
		limit = 15
	}
	let total = 0
	console.log('page,limit',page,limit)
	async.waterfall([
		function(cb){
			let search = bdsc_kycg.find({'showin':new RegExp('A')}).count()
				search.exec(function(err,count){
					if(err){
						console.log('gzzd get total err',err)
						cb(err)
					}
					console.log('noticgzzde count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = bdsc_kycg.find({'showin':new RegExp('A')})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('notice error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log(error)
			return res.end(error)
		}
		//res.json({'data':result})
		return res.render('kycg',{'count':total,'page':page,'data':result,'title':'科研成果'})
	})
})
//研究平台列表
router.get('/yjpt',function(req,res){
	let page = req.query.page,
		limit = req.query.limit
	if(!page||typeof(page)=='undefined'){
		page = 1
	}
	if(!limit||typeof(limit)=='undefined'){
		limit = 15
	}
	let total = 0
	console.log('page,limit',page,limit)
	async.waterfall([
		function(cb){
			let search = bdsc_kycg.find({'showin':new RegExp('B')}).count()
				search.exec(function(err,count){
					if(err){
						console.log('gzzd get total err',err)
						cb(err)
					}
					console.log('noticgzzde count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = bdsc_kycg.find({'showin':new RegExp('B')})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('notice error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log(error)
			return res.end(error)
		}
		//res.json({'data':result})
		return res.render('yjpt',{'count':total,'page':page,'data':result,'title':'研究平台'})
	})
})
//通知公告列表
router.get('/tzgg',function(req,res){
	let page = req.query.page,
		limit = req.query.limit
	if(!page||typeof(page)=='undefined'){
		page = 1
	}
	if(!limit||typeof(limit)=='undefined'){
		limit = 15
	}
	let total = 0
	console.log('page,limit',page,limit)
	async.waterfall([
		function(cb){
			let search = tzgg.find({}).count()
				search.exec(function(err,count){
					if(err){
						console.log('tzgg get total err',err)
						cb(err)
					}
					console.log('tzgg count',count)
					total = count
					cb(null)
				})
		},
		function(cb){
			let numSkip = (page-1)*limit
			limit = parseInt(limit)
				console.log('不带搜索参数')
				let search = tzgg.find({})
					search.sort({'time':-1})//正序
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(error,docs){
						if(error){
							console.log('notice error',error)
							cb(error)
						}
						cb(null,docs)
					})
			
		}
	],function(error,result){
		if(error){
			console.log(error)
			return res.end(error)
		}
		//res.json({'data':result})
		return res.render('tzgg',{'count':total,'page':page,'data':result,'title':'通知公告'})
	})
})
//组织架构
router.get('/zzjg',function(req,res){
	let search = news.findOne({'id':66})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('zzjg',{data:doc,'title':'组织架构'})
		})
})
//理事会
router.get('/syslsh',function(req,res){
	let search = news.findOne({'title':'实验室理事会'})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('syslsh',{data:doc,'title':'理事会'})
		})
})
//技术委员会
router.get('/jswyh',function(req,res){
	let search = news.findOne({'title':'实验室技术委员会'})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('jswyh',{data:doc,'title':'技术委员会'})
		})
})
//领导
router.get('/sysld',function(req,res){
	let search = news.findOne({'title':'实验室领导'})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('sysld',{data:doc,'title':'实验室领导'})
		})
})
//新闻详情
router.get('/newsdetail',function(req,res){
	let id = req.query.id
	let search = news.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('newsdetail',{data:doc,'title':doc.title})
		})
})
//学术活动详情
router.get('/xshddetail',function(req,res){
	let id = req.query.id
	let search = xsjl.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('xshddetail',{data:doc,'title':doc.name})
		})
})
//通知公告详情
router.get('/gggsdetail',function(req,res){
	let id = req.query.id
	let search = tzgg.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('gggsdetail',{data:doc,'title':doc.title})
		})
})
//研究平台详情(showin A 入口科研成果)
router.get('/yjptdetail',function(req,res){
	let id = req.query.id
	let search = bdsc_kycg.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('yjptdetail',{data:doc,'title':doc.title})
		})
})
//通知公告详情()
router.get('/tzggdetail',function(req,res){
	let id = req.query.id
	let search = tzgg.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('tzggdetail',{data:doc,'title':doc.title})
		})
})
//科研成果详情(showin B  入口科研成果)
router.get('/kycgdetail',function(req,res){
	let id = req.query.id
	let search = bdsc_kycg.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('kycgdetail',{data:doc,'title':doc.title})
		})
})
//规章制度详情
router.get('/gzzddetail',function(req,res){
	let id = req.query.id
	let search = gzzd.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('gzzddetail',{data:doc,'title':doc.title})
		})
})
//招贤纳士详情
router.get('/zxnsdetail',function(req,res){
	let id = req.query.id
	let search = zpxx.findOne({'id':id})
		search.exec(function(error,doc){
			if(error){
				res.end(error)
			}
			console.log(doc)
			res.render('zxnsdetail',{data:doc,'title':doc.title})
		})
})
module.exports = router;
