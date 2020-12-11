var express = require('express');
var router = express.Router();

const path = require('path')
const async = require('async')
const fs = require('fs')

//这是给图片上传的路径
const uploadDir = path.resolve(__dirname, '../../public/images/attachment')//G:\bdsc\public\images\attachment
fs.existsSync(uploadDir) || fs.mkdirSync(uploadDir)

//这是给附件的上传路径
const attachmentuploaddir = path.resolve(__dirname, '../../public/attachment')//G:\bdsc\public\attachment
fs.existsSync(attachmentuploaddir) || fs.mkdirSync(attachmentuploaddir)


const moment = require('moment')

//1025 ueditor
var ueditor = require("ueditor")
//1025
router.get("/ue", ueditor(path.join(__dirname, '../public/'), function(req, res, next) {
  console.log('ddd',path.join(__dirname, '../public/'))
  var imgDir = '/attachment/ueditor_images/' //默认上传地址为图片
  var ActionType = req.query.action;
    if (ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
        var file_url = imgDir;//默认上传地址为图片
        if (ActionType === 'uploadfile') {
            file_url = '/attachment/ueditor_files/'; //附件保存地址
        }
        if (ActionType === 'uploadvideo') {
            file_url = '/attachment/ueditor_videos/'; //视频保存地址
        }
        res.ue_up(file_url); 
        res.setHeader('Content-Type', 'text/html');
    }
  //客户端发起图片列表请求
  else if (ActionType === 'listimage'){
    
    res.ue_list(imgDir);  // 客户端会列出 dir_url 目录下的所有图片
  }
  else {
    res.setHeader('Content-Type', 'application/json');
    res.redirect('/ueditor/config.json')
  }
})).post('/ue',ueditor(path.join(__dirname, '../../public/'), function(req, res, next) {
  let baseimgDir = path.join(__dirname, '../../public')// //上传地址
  console.log('baseimgDir--->',baseimgDir);console.log()
  let imgDir = baseimgDir + '\\attachment\\ueditor_images' //创建目录使用
  console.log('imgDir--->',imgDir);console.log()

  fs.existsSync(imgDir) || fs.mkdirSync(imgDir)
  let ActionType = req.query.action;
    if (ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
        let file_url = '\\attachment\\ueditor_images';//上传地址
        if (ActionType === 'uploadfile') {
            let crefile_url = baseimgDir + '\\attachment\\ueditor_files'; //附件保存地址
            fs.existsSync(crefile_url) || fs.mkdirSync(crefile_url)
            file_url = '\\attachment\\ueditor_files'
        }
        if (ActionType === 'uploadvideo') {
            let crefile_url = baseimgDir + '\\attachment\\ueditor_videos'; //视频保存地址
            fs.existsSync(crefile_url) || fs.mkdirSync(crefile_url)
            file_url = '\\attachment\\ueditor_videos'
        }
        console.log('file_url---->', file_url)
		let filenamePattern = moment().format('YYYY-MM-DD') + '_' + moment().unix() + '_'
		console.log('filenamePattern--->',filenamePattern)
        res.ue_up(file_url,filenamePattern);
        res.setHeader('Content-Type', 'text/html');
    }
  //客户端发起图片列表请求
  else if (ActionType === 'listimage'){
    res.ue_list(imgDir);  
  }
  else {
    res.setHeader('Content-Type', 'application/json');
    res.redirect('/ueditor/config.json')
  }
}))
module.exports = router;
