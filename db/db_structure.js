/**
 *  @Author:    chenrongxin
 *  @Create Date:   2019-6-1
 *  @Description:   题目类别表
 */

    const mongoose = require('mongoose')
    mongoose.Promise = global.Promise;
    //服务器上
    const DB_URL = 'mongodb://spatial_lab:youtrytry@localhost:27017/spatial_lab'
    //本地
    //const DB_URL = 'mongodb://localhost:27017/dxxxhjs'
    mongoose.connect(DB_URL,{useNewUrlParser:true})

    /**
      * 连接成功
      */
    mongoose.connection.on('connected', function () {    
        console.log('Mongoose connection open to ' + DB_URL);  
    });    

    /**
     * 连接异常
     */
    mongoose.connection.on('error',function (err) {    
        console.log('Mongoose connection error: ' + err);  
    });    
     
    /**
     * 连接断开
     */
    mongoose.connection.on('disconnected', function () {    
        console.log('Mongoose connection disconnected');  
    });   

//var mongoose = require('./db'),
    let Schema = mongoose.Schema,
    moment = require('moment')

// //角色设置
// var roleSchema = new Schema({ 
//     name : {type:String},//名字
//     enname : {type:String},//保存在session的KEY
//     createTime : {type:String, default : moment().format('YYYY-MM-DD HH:mm:ss') },//创建时间
//     createTimeStamp : {type:String,default:moment().format('X')}//创建时间戳
// })

//用户
var userSchema = new Schema({ 
    id : {type:Number},//id
    account : {type:String},//账号 唯一
    password : {type:String},//
    name : {type:String},//名字
    gender : {type:String},//性别 0女 1男
    photo : {type:String},//
    degree : {type:String},//类别（研究生/博士后/教师/行政助理/毕业生/(客座/访问学者)）
    idcard : {type:String},//身份证
    phone : {type:String},//手机
    email : {type:String},
    othercontact : {type:String},
    ownurl : {type:String},//个人主页
    address : {type:String},
    urgencynam : {type:String},
    researcharea : {type:String},
    tutor : {type:String},
    thesis : {type:String},//论文题目
    graduationdate : {type:String},//毕业时间
    whereabouts : {type:String},//毕业去向
    ename : {type:String},
    eaddress : {type:String},
    eurgencynam : {type:String},
    eresearcharea : {type:String},
    eprofession : {type:String},
    workresume : {type:String},
    introduce : {type:String},
    etutor : {type:String},
    ethesis : {type:String},
    ewhereabouts : {type:String},
    eworkresume : {type:String},
    eintroduce : {type:String},
    grade : {type:String},
    title : {type:String},
    fax : {type:String},
    mphone : {type:String},
    etitle : {type:String},
    lastedituser : {type:String},
    lastedittime : {type:String},
    sort : {type:String}
},{collection:'user'})

//用户角色
var user_roleSchema = new Schema({
    id : {type:Number},
    roleid : {type:Number},
    userid : {type:Number}
},{collection:'user_role'})

//角色
var roleSchema = new Schema({
    id : {type:Number},
    name : {type:String},
    ename : {type:String}
},{collection:'role'})

//实验室
var laboratorySchema = new Schema({
    id : {type:Number},
    name : {type:String},
    createtime : {type:String},
    description : {type:String},
    ename : {type:String},
    edescription : {type:String},
    pic : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'laboratory'})

//实验室主任
var laboratorychiefSchema = new Schema({
    id : {type:Number},
    name : {type:String},
    photo : {type:String},
    tenure : {type:String},//任期
    introduction : {type:String},
    ename : {type:String},
    eintroduction : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'laboratory_chief'})

//学术委员会
var academic_committeeSchema = new Schema({
    id : {type:Number},
    name : {type:String},
    tenure : {type:String},//任期
    titles : {type:String},
    profession : {type:String},
    prefecture:{type:String},
    workplace : {type:String},
    ename : {type:String},
    etenure : {type:String},
    etitles : {type:String},
    eprofession : {type:String},
    eprefecture : {type:String},
    eworkplace : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'academic_committee'})

//研究方向
var research_directionsSchema = new Schema({
    id : {type:Number},
    name : {type:String},
    content : {type:String},
    ename : {type:String},
    econtent : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'research_directions'})

//仪器设备
var equipmentSchema = new Schema({
    id : {type:Number},
    name : {type:String},
    value : {type:String},
    unit : {type:String},
    brand : {type:String},
    model : {type:String},
    number : {type:String},
    dutyman : {type:String},
    manager : {type:String},
    pic : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'equipment'})

//仪器设备使用
var equipment_useSchema = new Schema({
    id : {type:Number},
    userid : {type:String},
    equid : {type:String},
    begintime : {type:String},
    endtime : {type:String},
    username:{type:String},
    equipmentname:{type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'equipment_use'})

//开发基金
var fundopenSchema = new Schema({
    id : {type:Number},
    register : {type:String},
    year : {type:String},
    name : {type:String},
    gender : {type:String},
    unit:{type:String},
    jobtitle:{type:String},
    idcard:{type:String},
    mphone:{type:String},
    email:{type:String},
    qq:{type:String},
    title:{type:String},
    keyword:{type:String},
    digest:{type:String},
    fundnumber:{type:String},
    direction:{type:String},
    issubsidize:{type:String},
    sum:{type:String},
    data:{type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'fundopen'})

//学术交流
var communicationSchema = new Schema({
    id : {type:Number},
    register : {type:String},//登记人id
    name : {type:String},
    type : {type:String},
    time : {type:String},
    address : {type:String},
    joinman : {type:String},
    intro : {type:String},
    etype : {type:String},
    ename : {type:String},
    eaddress : {type:String},
    ejoinman : {type:String},
    pageview : {type:String},
    eshow : {type:String},
    eintro : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'communication'})

//成果展示
var softwareSchema = new Schema({
    id : {type:String},
    name : {type:String},
    introduce : {type:String},
    pic : {type:String},
    url : {type:String},
    ename : {type:String},
    eintroduce : {type:String},
    sort : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'software'})

//首页图片
var index_picSchema = new Schema({
    id : {type:Number},
    pic : {type:String},
    time : {type:String},
    describe : {type:String},
    url : {type:String},
    sort : {type:Number},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'index_pic'})

//新闻中心
var newsSchema = new Schema({
    id : {type:Number},
    title : {type:String},
    time : {type:String},
    content : {type:String},
    etitle : {type:String},
    econtent : {type:String},
    pageview : {type:String},
    eshow : {type:Number,default:0},//英文时是否显示，0不显示，1显示
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'news'})

//通知公告
var noticeSchema = new Schema({
    id : {type:Number},
    title : {type:String},
    time : {type:String},
    content : {type:String},
    etitle : {type:String},
    econtent : {type:String},
    pageview : {type:String},
    eshow : {type:Number,default:0},//英文时是否显示，0不显示，1显示
    attachments : {type:String},
    attachmentsname : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'notice'})

//规章制度
var regulationsSchema = new Schema({
    id : {type:Number},
    title : {type:String},
    content : {type:String},
    time : {type:String},
    pdf : {type:String},
    pdfname : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'regulations'})

//最新成果
var index_achievementSchema = new Schema({
    id : {type:Number},
    tname : {type:String},
    achid : {type:String},
    pic : {type:String},
    cretime : {type:String,default:moment().format('YYYY-MM-DD HH:mm:ss')},
    eshow : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'index_achievement'})

//网站链接
var relatedlinkSchema = new Schema({
    id : {type:String},
    type : {type:String},
    url : {type:String},
    name : {type:String},
    picurl : {type:String},
    icon : {type:String},
    sort : {type:String},
    ename : {type:String},
    eshow : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'relatedlink'})

//招聘信息
var recruitSchema = new Schema({
    id : {type:Number},
    title : {type:String},
    content : {type:String},
    time : {type:String},
    etitle : {type:String},
    econtent : {type:String},
    type : {type:String},
    pageview : {type:Number},
    eshow : {type:Number,default:0},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'recruit'})

//开放基金附件
var fundfileSchema = new Schema({
    id : {type:Number},
    url : {type:String},
    name : {type:String},
    type : {type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'fundfile'})

//科研项目
var projectSchema = new Schema({
    id : {type:Number},
    register : {type:Number},//登记人ID
    name : {type:String},
    ename : {type:String},
    principal : {type:String},//负责人
    eprincipal : {type:String},
    year : {type:String},
    fundsource : {type:String},
    restimebegin : {type:String},//开始研究时间
    restimeend : {type:String},//结束研究时间
    category : {type:String},//项目类别（无用）9-4
    typeone : {type:String},
    typetwo : {type:String},
    typethree : {type:String},
    partner : {type:String},//合伙人
    digest : {type:String},//摘要
    edigest : {type:String},//
    contractno : {type:String},//合同号
    participant : {type:String},
    efundsource : {type:String},
    eparticipant : {type:String},//
    money :{type:String},//金额万元
    lastedituser : {type:String},//修改人
    lastedittime : {type:String},//最后修改时间
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'project'})

//期刊论文
var periodical_articleSchema = new Schema({
    id : {type:Number},
    register : {type:String},//登记人ID
    authors : {type:String},//作者，单个格式（作者，作者英文，单位, 单位英文, 是否通讯作者，是否本人），多个时用分号格开
    comauthors : {type:String},//通讯作者，多个时用分号格开，如（1;4;5）
    name : {type:String},
    periodical : {type:String},//期刊名称
    publishyear : {type:String},//出版年
    issue : {type:String},//期号
    issn : {type:String},//刊号
    pagination : {type:String},//页码
    digest : {type:String},//摘要
    edigest : {type:String},//
    ename : {type:String},
    eperiodical : {type:String},//期刊名称
    relevance : {type:String},//关联人员id，（多个时用分号隔开如，2;5）
    status : {type:String},//状态：已发表/已接受未发表
    include : {type:String},//收录情况：SCI、SSCI、A&HCI、EI、CPCI-S，CSSCI、CSCD 、中文核心，其它
    pdfurl : {type:String},//全文链接
    relevancename : {type:String},//关联人员姓名，（多个时用分号隔开如，2;5）
    reelnumber : {type:String},//卷号
    lastedituser : {type:String},//最后修改人
    lastedittime : {type:String},//最后修改时间
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'periodical_article'})

//关联项目
var project_achievementSchema = new Schema({
    id : {type:Number},
    relid : {type:Number},//项目主键
    tname : {type:String},//关联表名
    achid : {type:String},//关联成功主键
    isshow : {type:String}//0不显示
},{collection:'project_achievement'})

//会议论文
var conference_articleSchema = new Schema({
    id : {type:Number},
    register : {type:String},//登记人ID
    authors : {type:String},//作者，单个格式（作者，作者英文，单位, 单位英文, 是否通讯作者，是否本人），多个时用分号格开
    comauthors : {type:String},//通讯作者，多个时用分号格开，如（1;4;5）
    name : {type:String},
    periodical : {type:String},//会议名称
    address : {type:String},//会议地址
    publishyear : {type:String},//出版年
    pagination : {type:String},//页码
    digest : {type:String},//摘要
    edigest : {type:String},//
    ename : {type:String},
    eperiodical : {type:String},//期刊名称
    eaddress : {type:String},//会议地址
    relevance : {type:String},//关联人员id，（多个时用分号隔开如，2;5）
    status : {type:String},//状态：已发表/已接受未发表
    include : {type:String},//收录情况：SCI、SSCI、A&HCI、EI、CPCI-S，CSSCI、CSCD 、中文核心，其它
    pdfurl : {type:String},//全文链接
    relevancename : {type:String},//关联人员姓名，（多个时用分号隔开如，2;5）
    lastedituser : {type:String},//最后修改人
    lastedittime : {type:String},//最后修改时间
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'conference_article'})

//学位论文
var thesisSchema = new Schema({
    id : {type:Number},
    register : {type:String},//登记人ID
    authors : {type:String},//作者，单个格式（作者，作者英文，单位, 单位英文, 是否通讯作者，是否本人），多个时用分号格开
    tutor : {type:String},//导师,(多个用分号隔开，如：张三;李四)
    name : {type:String},
    digest : {type:String},//摘要
    unit : {type:String},//单位
    publishyear : {type:String},//出版年
    pags : {type:String},//页码
    relevance : {type:String},//关联人员id，（多个时用分号隔开如，2;5）
    edigest : {type:String},//
    ename : {type:String},
    eunit : {type:String},//
    etutor : {type:String},//期刊名称
    relevancename : {type:String},//关联人员姓名，（多个时用分号隔开如，2;5    
    lastedituser : {type:String},//最后修改人
    lastedittime : {type:String},//最后修改时间
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'thesis'})

//专著
var treatiseSchema = new Schema({
    id : {type:Number},
    register : {type:String},//登记人ID
    name : {type:String},
    authors : {type:String},//作者，单个格式（作者，作者英文，单位, 单位英文, 是否通讯作者，是否本人），多个时用分号格开
    publish : {type:String},//出版社
    publishyear : {type:String},//出版年
    publishaddr : {type:String},//出版地址
    isbn : {type:String},//isbn号
    pagination : {type:String},//页码
    versions : {type:String},//版本
    digest : {type:String},//摘要
    edigest : {type:String},//
    pic : {type:String},//封面图片
    ename : {type:String},
    epublish : {type:String},
    epublishaddr : {type:String},
    relevance : {type:String},//关联人员id，（多个时用分号隔开如，2;5）
    relevancename : {type:String},//关联人员姓名，（多个时用分号隔开如，2;5    
    lastedituser : {type:String},//最后修改人
    lastedittime : {type:String},//最后修改时间
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'treatise'})

//获奖
var awardSchema = new Schema({
    id : {type:Number},
    register : {type:String},//登记人ID
    name : {type:String},
    authors : {type:String},//作者，单个格式（作者，作者英文，单位, 单位英文, 是否通讯作者，是否本人），多个时用分号格开
    certigier : {type:String},//授予单位
    year : {type:String},//授予年份
    awardname : {type:String},//奖励名称
    type : {type:String},//奖励类别
    level : {type:String},//奖励等级
    relevance : {type:String},//关联人员id，（多个时用分号隔开如，2;5）
    ename : {type:String},
    ecertigier : {type:String},
    eawardname : {type:String},
    relevancename : {type:String},//关联人员姓名，（多个时用分号隔开如，2;5    
    account : {type:String},//总人数
    ranking : {type:String},//排名
    lastedituser : {type:String},//最后修改人
    lastedittime : {type:String},//最后修改时间
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'award'})

//专利
var patentSchema = new Schema({
    id : {type:Number},
    register : {type:String},//登记人ID
    authors : {type:String},//作者，单个格式（作者，作者英文，单位, 单位英文, 是否通讯作者，是否本人），多个时用分号格开
    name : {type:String},
    certigier : {type:String},//授予单位
    year : {type:String},//授予年份
    patentname : {type:String},//专利名称
    type : {type:String},//专利类别
    relevance : {type:String},//关联人员id，（多个时用分号隔开如，2;5）
    ename : {type:String},
    ecertigier : {type:String},
    epatentname : {type:String},
    patentno : {type:String},
    status : {type:String},//专利状态：已授权/已申请未授权
    country : {type:String},//国别
    lastedituser : {type:String},//最后修改人
    lastedittime : {type:String},//最后修改时间
    relevancename:{type:String},
    showin : {type:String,default:'A'}//显示在哪些页面(A,B,C,D,E)
},{collection:'patent'})

var menuSchema = new Schema({
    id : {type:Number},
    name : {type:String},//菜单名
    pid : {type:Number},//父id
    hide : {type:String},//是否显示0不显示1显示
    url : {type:String},//
    sort : {type:String},//排序
    position : {type:String},//位置 1顶部 2底部（中间） 3都在
    time : {type:String,default:moment().format('YYYY-MM-DD HH:mm:ss')}
},{collection:'menu'})

exports.role = mongoose.model('role',roleSchema)
exports.laboratory = mongoose.model('laboratory',laboratorySchema)
exports.laboratory_chief = mongoose.model('laboratory_chief',laboratorychiefSchema)
exports.academic_committee = mongoose.model('academic_committee',academic_committeeSchema)
exports.research_directions = mongoose.model('research_directions',research_directionsSchema)
exports.communication = mongoose.model('communication',communicationSchema)
exports.news = mongoose.model('news',newsSchema)
exports.notice = mongoose.model('notice',noticeSchema)
exports.regulations = mongoose.model('regulations',regulationsSchema)
exports.recruit = mongoose.model('recruit',recruitSchema)
exports.index_pic = mongoose.model('index_pic',index_picSchema)
exports.project = mongoose.model('project',projectSchema)
exports.periodical_article = mongoose.model('periodical_article',periodical_articleSchema)
exports.conference_article = mongoose.model('conference_article',conference_articleSchema)
exports.thesis = mongoose.model('thesis',thesisSchema)
exports.treatise = mongoose.model('treatise',treatiseSchema)
exports.award = mongoose.model('award',awardSchema)
exports.patent = mongoose.model('patent',patentSchema)
exports.user = mongoose.model('user',userSchema)
exports.role = mongoose.model('role',roleSchema)
exports.user_role = mongoose.model('user_role',user_roleSchema)
exports.project_achievement = mongoose.model('project_achievement',project_achievementSchema)
exports.fundfile = mongoose.model('fundfile',fundfileSchema)
exports.index_achievement = mongoose.model('index_achievement',index_achievementSchema)
exports.relatedlink = mongoose.model('relatedlink',relatedlinkSchema)
exports.software = mongoose.model('software',softwareSchema)
exports.equipment = mongoose.model('equipment',equipmentSchema)
exports.equipment_use = mongoose.model('equipment_use',equipment_useSchema)
exports.fundopen = mongoose.model('fundopen',fundopenSchema)
exports.menu = mongoose.model('menu',menuSchema)