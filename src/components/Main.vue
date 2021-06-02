<template>
  <VContainer
    fluid
    class="lighten-4"
  >
    <VRow dense>
      <VCol
        cols="4"
      >
        <VCard
          class="mx-auto"
          shaped
        >
          <VCardTitle class="headline">
            Последние изменения
          </VCardTitle>
          <VList>
            <VListItem
              v-for="(item) in lastChanges"
              :key="item.uri.toString()"
              link
              @click="goLink(item)"
            >
              <VListItemIcon>
                <VIcon>{{ item.icon }}</VIcon>
              </VListItemIcon>
              <VListItemContent>
                <VListItemTitle v-text="item.title" />
                <VListItemSubtitle
class="text--primary"
                                   v-text="item.location"
                />
                <VListItemSubtitle v-text="item.author" />
              </VListItemContent>
              <VListItemAction>
                <VListItemActionText v-html="item.display_moment" />
              </VListItemAction>
            </VListItem>
          </VList>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script>
    import GitHelper from './../helpers/gitlab';
    import dateFormat from  'dateformat';

    export default {
        name: 'MainPage',
        data () {
            return {
            };
        },
        computed: {
            lastChanges() {
                let result = [];
                for(let key in this.$store.state.last_changes) {
                    let item = this.$store.state.last_changes[key];
                    let doc = this.$store.state.docs[key];
                    let moment = new Date(item[0].created_at);
                    result.push({
                        title: item[0].title,
                        moment : moment,
                        display_moment: dateFormat(moment,'dd.mm.yy<br>hh:mm:ss'),
                        author: item[0].author_name,
                        icon: doc.icon,
                        uri: doc.uri,
                        location: doc.location
                    });
                }
                return result.sort((a, b) => b.moment - a.moment);
            }
        },
        mounted() {
            // eslint-disable-next-line no-debugger
            let hash  = GitHelper.parseHashParams(this.$route.hash.substr(1));
            if('access_token' in hash) {
                this.$store.dispatch('onReceivedOAuthToken', hash.access_token);
            }
        },
        methods: {
            goLink(item) {
                this.$router.push({
                    name: 'swagger',
                    params: {
                        source: btoa(item.uri)
                    }
                });
            }
        }
    };
</script>

<style scoped>

</style>
