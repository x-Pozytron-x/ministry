//--- Page S-88 ---//


function get_meetings() {
  let months = ['September', 'October', 'November', 'December', 'Jannuary', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
    midweekStat = "";
    months.forEach((key) => {
      midweekStat += "<tr>";
      midweekStat += `<td>${key}</td><td>0</td><td>0</td><td>0</td>`;
      midweekStat += "</tr>";
    });
  return midweekStat;
}

function s88() {

  let currYear = new Date().getFullYear();
  let lastYear  = currYear - 1;

  const _component = document.createElement('section');
  _component.classList.add("section");
  _component.classList.add("s88"); 
  _component.innerHTML = `
    <h2>S-88: ${lastYear}/${currYear}</h2>
    <br>
    <table>
      <caption>
        Midweek Meetings
      </caption>
      <thead>
        <th>Month</th>
        <th>Number of Meetings</th>
        <th>Total Attenndence</th>
        <th>AverageAttenndance</th>
      </thead>
      <tbody>
        ${get_meetings()}
        <tr><td></td><td></td></tr>
      </tbody>
    </table>

    <br>

    <table>
      <caption>
        Weekend Meetings
      </caption>
      <thead>
        <th>Month</th>
        <th>Number of Meetings</th>
        <th>Total Attenndence</th>
        <th>AverageAttenndance</th>
      </thead>
      <tbody>
        ${get_meetings()}
      </tbody>
    </table>
  `;
  return _component;
};