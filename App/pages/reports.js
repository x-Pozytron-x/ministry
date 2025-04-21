//--- Page publishers ---//

function reports () {
  const _component = document.createElement('section');
  _component.classList.add("section");
  _component.classList.add("reports"); 
  _component.innerHTML = `
    <h2>Reports: May</h2>
    <br>
    <table>
      <thead>
        <th>Publisher</th>
        <th>Shared?</th>
        <th>Studies</th>
        <th>isAux?</th>
        <th>Hours</th>
        <th>Remarks</th>
      </thead>
      <tbody>
        <tr>
          <td>Ivvan Ivanov</td>
          <td>&#9745;</td>
          <td>2</td>
          <td>&#9745;</td>
          <td>17</td>
          <td>15 hours</td>
        </tr>
      </tbody>
    </table>
  `;
  return _component;
};