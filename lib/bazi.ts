import { Solar } from 'lunar-typescript';
import { validBirthday } from './local-data';
export function calculateBazi(birthday:string,time:string) {
 if(!validBirthday(birthday,time))throw new Error('请输入1900年起的有效出生日期和时间，不能晚于现在。');
 const [y,m,d]=birthday.split('-').map(Number);const [h,min]=time.split(':').map(Number);
 const lunar=Solar.fromYmdHms(y,m,d,h,min,0).getLunar();const eight=lunar.getEightChar();eight.setSect(2);
 const pillars=[
  {label:'年柱',ganZhi:eight.getYear(),elements:eight.getYearWuXing(),nayin:eight.getYearNaYin(),god:eight.getYearShiShenGan()},
  {label:'月柱',ganZhi:eight.getMonth(),elements:eight.getMonthWuXing(),nayin:eight.getMonthNaYin(),god:eight.getMonthShiShenGan()},
  {label:'日柱',ganZhi:eight.getDay(),elements:eight.getDayWuXing(),nayin:eight.getDayNaYin(),god:'日主'},
  {label:'时柱',ganZhi:eight.getTime(),elements:eight.getTimeWuXing(),nayin:eight.getTimeNaYin(),god:eight.getTimeShiShenGan()},
 ];
 const elements=['木','火','土','金','水'].map(name=>({name,count:pillars.reduce((sum,p)=>sum+[...p.elements].filter(e=>e===name).length,0)}));
 return {pillars,elements,lunar:lunar.toString(),dayMaster:eight.getDayGan()};
}
