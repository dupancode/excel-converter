new Vue({
  el: '#app',
  data() {
    return {
      tableData: [],
      tableHeaders: [],
      selectedFormat: 'JSON',
      showHeaderFooter: false,
      header: '',
      footer: ''
    };
  },
  methods: {
    handleFile(event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        this.tableHeaders = jsonData[0];
        this.tableData = jsonData.slice(1);
      };
      reader.readAsArrayBuffer(file);
    },
    getExportCode() {
      if (this.selectedFormat === 'JSON') {
        const jsonData = this.tableData.map(row => {
          const obj = {};
          this.tableHeaders.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
        return `const data = ${JSON.stringify(jsonData, null, 2)};`;
      } else if (this.selectedFormat === 'HTML') {
        return `<table>
  <thead>
    <tr>
      ${this.tableHeaders.map(h => `<th>${h}</th>`).join('\n      ')}
    </tr>
  </thead>
  <tbody>
    ${this.tableData.map(row => `
    <tr>
      ${row.map(cell => `<td>${cell}</td>`).join('\n      ')}
    </tr>`).join('\n    ')}
  </tbody>
</table>`;
      }
      return '';
    },
    async exportData() {
      const area = this.$refs.previewArea;
      switch (this.selectedFormat) {
        case 'JSON':
        case 'HTML':
          const blob = new Blob([this.getExportCode()], {
            type: this.selectedFormat === 'JSON' ? 'application/json' : 'text/html'
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `export.${this.selectedFormat.toLowerCase()}`;
          a.click();
          URL.revokeObjectURL(url);
          break;
          
        case 'PDF':
          await html2pdf().from(area).set({
            margin: 1,
            filename: 'export.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
          }).save();
          break;
          
        case 'PNG':
          const canvas = await html2canvas(area);
          const pngUrl = canvas.toDataURL('image/png');
          const pngLink = document.createElement('a');
          pngLink.href = pngUrl;
          pngLink.download = 'export.png';
          pngLink.click();
          break;
      }
    }
  }
});