//--- Page S-88 ---//

MyApp.pages.s88 = {
  render: function () {
    const container = document.getElementById('content-area');
    let currMonth = new Date().getMonth();
    let currYear = new Date().getFullYear();
    if (currMonth >= 8) {
      firstYear = new Date().getFullYear();
      secondYear = new Date().getFullYear() + 1;
    } else {
      firstYear = new Date().getFullYear() - 1;
      secondYear = new Date().getFullYear();
    }
    if(typeof dbData !== 'undefined' ) {
      container.innerHTML = `
        <h2>S-88: ${firstYear}/${secondYear}</h2>
        <!--<button onclick="saveMonths()">Save</button>-->
        ${printMonth(firstYear, 9)}
        ${printMonth(firstYear, 10)}
        ${printMonth(firstYear, 11)}
        ${printMonth(firstYear, 12)}
      `;
    } else {
      container.innerHTML = `please load db`;
    }
  }
}

function saveMonths() {  
  let inputs = document.querySelectorAll("input");
  let arr = {};
  inputs.forEach((i) => {
    month = i.name.split("_")[0];
    if (!arr[month]) {
      arr[month] = { midweek: [], weekend: [] };
    }
    if(i.classList.contains("midweek")) {
      arr[month].midweek.push(i.value);
    }
    if(i.classList.contains("weekend")) {
      arr[month].weekend.push(i.value);
    }
  })
  dbData['tbl_s88'] = arr;
  console.log('S-88: Saved')
}

function getTuesdaysAndSaturdays(year, month) {
  const thisMonth = {};
  const midweekCurr = [];
  const weekendCurr = [];
  const firstDay = new Date(year, month - 1, 1);
  let currentDate = new Date(firstDay); 
  while (currentDate.getMonth() === month - 1) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 2) { midweekCurr.push(currentDate.getDate());} 
    if (dayOfWeek === 6) { weekendCurr.push(currentDate.getDate());} 
    currentDate.setDate(currentDate.getDate() + 1);
  }
  if (midweekCurr[0] > weekendCurr[0]) {
    if(midweekCurr.length < 5) midweekCurr.unshift(0);
    if(weekendCurr.length < 5) weekendCurr.push(0);
  } else {
    if(weekendCurr.length < 5) weekendCurr.push(0);
  }
  thisMonth[month] = {'midweek': midweekCurr, 'weekend': weekendCurr};
  return thisMonth;
}

function printMonth(currYear, month) {
  return `
  <br>
  <table class="s88-table">

  <thead>
    <th colspan="6">${getMonthName(month)}</th>
    <th>Total</th>
    <th>Average</th>
  </thead>

  <tr>
    <td rowspan="2">Midweek</td>
    ${printMeetDates(currYear, month, "midweek")}
    <td rowspan="2">${total(month, "midweek")}</td>
    <td rowspan="2"></td>
  </tr> 
  <tr>
   ${printMeetValues(month, "midweek")}
  </tr> 
  <tr>
    <td rowspan="2">Weekend</td>
    ${printMeetDates(currYear, month, "weekend")}
    <td rowspan="2"></td>
    <td rowspan="2"></td>
  </tr>
  <tr>
   ${printMeetValues(month, "weekend")}
  </tr> 

  </table>`;
}

function printMeetDates(year, month, meet) {
  let meetsDates = getTuesdaysAndSaturdays(year, month);
  let td = '';
  for (i=0;i<5;i++) {
    if (meetsDates[month][meet][i] == 0) {
       meetsDates[month][meet][i] = "";
    } else {
      tdClass = "";
    }
    td += '<td>'+meetsDates[month][meet][i]+'</td>';
    tdClass = "";
  } 
  return td;
}

function printMeetValues(month, meet) {
  let td = '';
  for (i=0;i<5;i++) {
    const value = dbData?.['tbl_s88']?.[month]?.[meet]?.[i] ?? "";
    td += `<td><input type="number" class="${meet}" name="${month}_${i}" value="${value}" oninput="saveMonths()"></td>`;
  }
  return td;
}

function total(month, meet) {
  
  return '888'
}