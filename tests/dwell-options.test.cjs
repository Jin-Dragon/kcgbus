const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {loadApp} = require('./simulation-harness.cjs');

const baseApp=loadApp();

function simulation(value, pathMode='drawn', weighted=false) {
  const point=(distance,name,ridership)=>({lat:37.5+distance/111195,lng:127,name,ridership});
  const stops=[point(0,'A',weighted?60:null),point(500,'B',weighted?30:null),
    point(1000,'C',weighted?10:null),point(1500,'D',weighted?0:null)];
  const guidance={...point(250,'경로유도점 1'),isVirtual:true};
  const points=[stops[0],guidance,...stops.slice(1)];
  const coordinates=stops.map(({lat,lng})=>({lat,lng}));
  const app=loadApp({
    config:{appKey:'test-only'},getPointsInRoute:()=>points,
    getPathsInRoute:()=>[{coordinates}],
    applyRouteSimulationCorrection:(_route,segment)=>segment,
  });
  const options=app.normalizeRouteTimeSimulationOptions({
    pathMode,stopDwellSeconds:value,busDelayPercent:0,selectedDate:'2026-10-20',
    selectedRouteNames:['테스트'],startHour:10,endHour:10,
  });
  const prepared=app.buildRouteTimeSimulationSegments('테스트',{...options,pathMode:'drawn'});
  const response=app.buildDrawnRouteTimeSimulationResponse([prepared],[{label:'10:00',departureTime:'202610201000'}],options);
  if (pathMode==='kakao') {
    // A deterministic future-directions response; no real API calls are needed.
    response.routes[0].simulations[0].driveSeconds=600;
    response.routes[0].simulations[0].dwellSecondsTotal=9999;
  }
  const report=app.buildRouteTimeSimulationReport(response,options);
  return {app,report,row:report.rows[0]};
}

for (const value of [undefined,null,'','   ']) {
  test(`empty dwell option ${String(value)} keeps the 26-second default`, () => {
    assert.equal(baseApp.normalizeRouteTimeSimulationOptions({stopDwellSeconds:value}).stopDwellSeconds,26);
  });
}

for (const value of [0,'0',15,'30',12.5]) {
  test(`explicit dwell option ${String(value)} is preserved exactly`, () => {
    assert.equal(baseApp.normalizeRouteTimeSimulationOptions({stopDwellSeconds:value}).stopDwellSeconds,Number(value));
  });
}

test('invalid dwell options fail instead of silently using a different value', () => {
  for (const value of [-1,'-1','abc',Infinity,NaN,{},[],false]) {
    assert.throws(()=>baseApp.normalizeRouteTimeSimulationOptions({stopDwellSeconds:value}),/대기시간/);
  }
});

for (const mode of ['drawn','kakao']) {
  for (const value of ['',0,30,12.5]) {
    test(`${mode}: dwell ${String(value)} reaches totals, stop timeline, logs and export`, () => {
      const {app,report,row}=simulation(value,mode);
      const base=value===''?26:Number(value);
      const expected=Math.round(base)*3;
      assert.equal(report.options.stopDwellSeconds,base);
      assert.equal(row.researchProfile.baseDwellSeconds,base);
      assert.equal(row.researchProfile.virtualStopCount,1);
      assert.equal(row.dwellSecondsTotal,expected);
      assert.equal(row.stopCount,4);
      assert.equal(row.stopTimeline.reduce((sum,item)=>sum+item.dwellSeconds,0),expected);
      assert.equal(row.chunkTimeProfiles.reduce((sum,item)=>sum+item.totalSeconds,0),row.totalSeconds);
      assert.equal(row.totalSeconds,row.driveSeconds+expected);
      assert.equal(row.researchProfile.stopDetails.at(-1).dwellSeconds,0);
      if (mode==='kakao') assert.equal(row.driveSeconds,600);
      const log=app.buildRouteTimeSimulationLogText(row);
      assert.ok(log.includes(`기준 정류장 대기시간: ${base}초`));
      assert.ok(log.includes(`정류장별 ${base}초 x 승객비중 가중치`));
      assert.ok(log.includes('버스지체보정률: 0.0%'));
      const html=app.buildRouteTimeSimulationResultsWindowHtml(report);
      assert.ok(html.includes(`정류장별 기본 대기시간: ${base}초`));
      assert.ok(html.includes(app.formatSimulationDurationLabel(row.totalSeconds)));
      const xml=app.buildRouteTimeSimulationExcelWorkbook(report);
      const worksheets=[...xml.matchAll(/<Worksheet ss:Name="([^"]+)">([\s\S]*?)<\/Worksheet>/g)];
      const rowsFor=name=>[...worksheets.find(item=>item[1]===name)[2].matchAll(/<Row>([\s\S]*?)<\/Row>/g)]
        .map(row=>[...row[1].matchAll(/<Data ss:Type="[^"]+">([\s\S]*?)<\/Data>/g)].map(cell=>cell[1]));
      const summary=rowsFor('Simulation Summary');
      const detail=rowsFor('Stop Details');
      assert.equal(summary[1][summary[0].indexOf('base_dwell_seconds')],String(base));
      assert.ok(detail.slice(1).every(stop=>stop[detail[0].indexOf('base_dwell_seconds')]===String(base)));
      assert.equal(detail.slice(1).reduce((sum,stop)=>sum+Number(stop[detail[0].indexOf('applied_dwell_seconds')]),0),expected);
    });
  }
}

test('changing the base dwell time retains passenger weights and terminal exclusion', () => {
  const {row}=simulation(40,'drawn',true);
  assert.equal(row.researchProfile.stopDetails.map(p=>p.dwellSeconds).join(','),'54,54,48,0');
  assert.equal(row.dwellSecondsTotal,156);
  assert.equal(simulation(0,'drawn',true).row.dwellSecondsTotal,0);
});

function submitSettings(dwell) {
  const html=baseApp.buildRouteTimeSimulationSettingsWindowHtml('original','기존 노선',[],baseApp.normalizeRouteTimeSimulationOptions());
  const script=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  const listeners={};
  const values={stopDwellSeconds:dwell,busDelayPercent:'0',pathMode:'drawn',selectedDate:'2026-10-20',startHour:'10',endHour:'10',intervalMinutes:'60'};
  let submitted;
  const element=()=>({innerHTML:'',appendChild(){},addEventListener(){}});
  const form={addEventListener:(name,callback)=>listeners[name]=callback};
  const context=vm.createContext({
    document:{getElementById:id=>id==='route-time-simulation-form'?form:element(),
      createElement:element,querySelectorAll:()=>[{value:'테스트',checked:true,disabled:false}]},
    FormData:class {get(name){return values[name]??null;}},
    window:{opener:{__wonderLinxRouteTime:{startFromSettings:(_group,options)=>submitted=options}}},
  });
  vm.runInContext(script,context);
  listeners.submit({preventDefault(){}});
  return {html,submitted};
}

test('settings form submits blank separately from zero and custom seconds', () => {
  for (const value of ['', '0', '30.5']) {
    const {html,submitted}=submitSettings(value);
    assert.equal(baseApp.normalizeRouteTimeSimulationOptions(submitted).stopDwellSeconds,value===''?26:Number(value));
    assert.equal(submitted.busDelayPercent,0);
    assert.match(html,/name="stopDwellSeconds"[^>]*value=""[^>]*placeholder="미입력 시 기본값 26초"/);
  }
});

test('settings form can show an explicitly configured zero as zero', () => {
  const html=baseApp.buildRouteTimeSimulationSettingsWindowHtml('original','기존 노선',[],{stopDwellSeconds:0});
  assert.match(html,/name="stopDwellSeconds"[^>]*value="0"/);
});

test('server request normalization agrees with the frontend default, zero and decimal options', () => {
  const source=fs.readFileSync(require.resolve('../server.js'),'utf8');
  const context=vm.createContext({});
  const constant=source.match(/^const DEFAULT_STOP_DWELL_SECONDS = .*;/m)[0];
  const dwell=source.match(/^function normalizeStopDwellSeconds\(value\) \{[\s\S]*?^\}/m)[0];
  const normalize=source.match(/^function normalizeRouteTimeSimulationPayload\(payload\) \{[\s\S]*?^\}/m)[0];
  vm.runInContext([constant,dwell,normalize].join('\n'),context);
  for (const value of [undefined,null,'','   ',0,'0',30,12.5]) {
    const expected=baseApp.normalizeRouteTimeSimulationOptions({stopDwellSeconds:value}).stopDwellSeconds;
    assert.equal(context.normalizeRouteTimeSimulationPayload({options:{stopDwellSeconds:value}}).options.stopDwellSeconds,expected);
  }
  assert.throws(()=>context.normalizeRouteTimeSimulationPayload({options:{stopDwellSeconds:-1}}),/대기시간/);
});
