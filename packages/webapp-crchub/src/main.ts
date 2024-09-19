import App from './App.svelte';
import { Amplify } from 'aws-amplify';
import awsconfig from '../amplifyconfiguration.json';

Amplify.configure(awsconfig);

const app = new App({
  target: document.body,
  props: {
    // you can pass props here if needed
  }
});

export default app;