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

    container.innerHTML = `
      <h2>S-88: ${firstYear}/${secondYear}</h2>
      <button onclick="saveMonths()">Save</button>
    ${printMonth(currYear, 9)}
    ${printMonth(currYear, 10)}
    ${printMonth(currYear, 11)}
    ${printMonth(currYear, 12)}
    ${printMonth(secondYear, 1)}
      `;
  }
}


let s88_db = {
  9 : [70, 78, 0, 0, 77, 90, 76, 0, 0, 0],
  10 : [],
  11 : [],
  12 : [],
  1 : []
}

let s88_db_map = new Map(Object.entries(s88_db));

function saveMonths() {

  for (i=0;i<=9;i++) {
    let name = 'day_9_'+i;
    let input = document.getElementsByName(name);
    console.log(input[0].value);
  } 
  console.log('saved');
}

function getTuesdaysAndSaturdays(year, month) {
  const dates = [];
  const firstDay = new Date(year, month - 1, 1);
  let currentDate = new Date(firstDay); 

  while (currentDate.getMonth() === month - 1) {
    const dayOfWeek = currentDate.getDay();

    if (dayOfWeek === 2 || dayOfWeek === 6) { dates.push(currentDate.getDate());} 
   
    currentDate.setDate(currentDate.getDate() + 1);
  }

  let isFirst = new Date(year, month - 1, dates[0]);

  if (isFirst.getDay() == 6 && dates.length == 9 ) {
    dates.unshift(0)
  }
  
  if (isFirst.getDay() == 6 && dates.length == 8 ) {
    dates.unshift(0)
  }
  
  if (dates.length <10 ) {
    dates.push(0)
  }
  if (dates.length <10 ) {
    dates.push(0)
  }
  return dates;
}

function printMeetDates(year, month, meet) {
  let meetsDates = getTuesdaysAndSaturdays(year, month)
  let td = '';
  for (i=0;i<meetsDates.length;i++) {

    if (meetsDates[i] == 0) {
       meetsDates[i] = "";
    } else {
      tdClass = "";
    }

    if ((meet == "midweek") && (i==0 || (i%2)==0)) {
        td += '<td>'+meetsDates[i]+'</td>';
    } else if ((meet == "weekend") && (i!=0 && (i%2)!=0)) { 
        td += '<td>'+meetsDates[i]+'</td>'; 
    }
    tdClass = "";
  } 
  return td;
}

function printMeeCount(month, meet) {

  let td = '';
  let i;
  if (meet == "midweek") {
    i = 0;
  } else if (meet == "weekend") {
    i = 1;
  }
  for (i;i<10;i+=2) {
    let count = (s88_db_map.get(month.toString())[i]) ? s88_db_map.get(month.toString())[i] : "";
    td += '<td><input type="text" name="day_'+month+'_'+i+'" value="'+count+'"></td>';  
  } 
  return td;
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
    <td rowspan="2"></td>
    <td rowspan="2"></td>
  </tr> 
  <tr>
    ${printMeeCount(month, "midweek")}
  </tr> 
  <tr>
    <td rowspan="2">Weekend</td>
    ${printMeetDates(currYear, month, "weekend")}
    <td rowspan="2"></td>
    <td rowspan="2"></td>
  </tr>
  <tr>
    ${printMeeCount(month, "weekend")}
  </tr> 

  </table>`;
}

function getMonthName(month) {
  let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return months[parseInt(month) - 1];
}
