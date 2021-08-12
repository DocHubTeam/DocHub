<template>
  <v-app id="keep">
    <v-app-bar
        app
        clipped-left
        color="#3495db"
        dark
    >
      <v-app-bar-nav-icon @click="drawer = !drawer">
        <div
            style="padding:4px; background: #fff; border-radius: 17px;"
        >
          <svg
              width="24px"
              height="24px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style="background: #fff; border-radius: 3px;"
          >
            <path
                d="M14.5264 23.5895C19.2934 23.5895 23.1579 19.725 23.1579 14.9579C23.1579 10.1908 19.2934 6.32629 14.5264 6.32629C9.75927 6.32629 5.89478 10.1908 5.89478 14.9579C5.89478 19.725 9.75927 23.5895 14.5264 23.5895Z"
                fill="#3495DB"></path>
            <path opacity="0.9" fill-rule="evenodd" clip-rule="evenodd"
                  d="M9.05263 18.1053C14.0523 18.1053 18.1053 14.0523 18.1053 9.05263C18.1053 4.053 14.0523 0 9.05263 0C4.053 0 0 4.053 0 9.05263C0 14.0523 4.053 18.1053 9.05263 18.1053ZM9.05263 15.7035C12.7259 15.7035 15.7035 12.7259 15.7035 9.05263C15.7035 5.37945 12.7259 2.40172 9.05263 2.40172C5.37945 2.40172 2.40172 5.37945 2.40172 9.05263C2.40172 12.7259 5.37945 15.7035 9.05263 15.7035Z"
                  fill="#081935"></path>
          </svg>
        </div>
      </v-app-bar-nav-icon>
      <v-toolbar-title style="cursor: pointer" @click="$router.push({name: 'main'})">DocHub</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon title="Стравнить">
        <v-icon>mdi-call-split</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app clipped color="grey lighten-4">
      <Menu></Menu>
    </v-navigation-drawer>
    <v-content>
      <router-view/>
    </v-content>
  </v-app>
</template>

<script>

import Menu from "./Menu";

export default {
  name: 'Root',
  components: {
    Menu
  },
  data() {
    return {
      drawer: null,
    };
  }
};
</script>

<style>
@import '../assets/material_icons.css';
@import '~vuetify/dist/vuetify.min.css';
@import '~swagger-ui/dist/swagger-ui.css';

.swagger-ui {
  width: 100%;
}

</style>
