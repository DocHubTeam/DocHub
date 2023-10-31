export const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false
};

export default {
  props: {
    profile: {
      type: Object,
      required: true
    },
    pullData: {
      type: Function,
      required: true
    },
    datasetIdKey: {
      type: String,
      default: 'label'
    },
    cssClasses: {
      default: '',
      type: String
    },
    styles: {
      type: Object,
      default: () => {}
    },
    plugins: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      refresher: null,
      width: this.profile.width || this.profile.size || 400,
      height: this.profile.height || this.profile.size || 400,
      chartData: {
        labels: [],
        datasets: []
      },
      chartOptions: { ...defaultOptions, ...this.profile.options }
    };
  },
  watch: {
    profile() {
      this.onRefresh();
    }
  },
  mounted() {
    this.onRefresh();
  },
  methods: {
    onRefresh() {
      if (this.refresher) clearTimeout(this.refresher);
      this.refresher = setTimeout(this.doRefresh, 50);
    },
    doRefresh() {
      if (this.profile) {

        this.pullData().then((result) => {
          try {
            this.chartData.labels = [...(result?.labels || []), ...(this.profile.labels || [])];
            this.chartOptions = { ...defaultOptions, ...result?.options, ...this.profile.options };

            this.chartData.datasets = result?.datasets?.map((dataset) =>
              dataset.color ? { ...this.dataSetWithDefaultOptions(dataset), ...dataset } : dataset
            ) || [];
          } catch (e) {
            this.error = e;
          }
        }).catch((e) => this.error = e);

      }
    }
  }
};
