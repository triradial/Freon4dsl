import App from './App.svelte';
import { Amplify } from 'aws-amplify';
import awsconfig from '../amplifyconfiguration.json';

import { WebappConfigurator } from "@freon4dsl/webapp-lib";
import { StudyConfigurationModelEnvironment} from "@freon4dsl/samples-study-configuration";
import { ServerCommunication } from "@freon4dsl/core";

WebappConfigurator.getInstance().setEditorEnvironment(StudyConfigurationModelEnvironment.getInstance());
WebappConfigurator.getInstance().setServerCommunication(ServerCommunication.getInstance());

Amplify.configure(awsconfig);

const app = new App({
  target: document.body,
  props: {
    // you can pass props here if needed
  }
});

export default app;