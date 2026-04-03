<script>
import HelloWorld from './components/HelloWorld.vue';
import HomePage from './pages/HomePage.vue';

export default {
  name: 'App',
  mounted() { // 页面挂载完成后会执行的方法--勾子方法
    console.log("*************************")
    // 页面初始化工作需要用到此方法
  },
  components: {
    HelloWorld,
    HomePage
  },
  // 定义组件的响应式数据
  data() {
    return {
      
    }
  },
  props: {
   
  },
  methods: {
    
  }

};

</script>

<template>
  <router-view/>
</template>

<style scoped></style>
