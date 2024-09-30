import App from './App.svelte';
import { Amplify } from 'aws-amplify';
import awsconfig from '../amplifyconfiguration.json';

import { WebappConfigurator } from "@freon4dsl/webapp-lib";
import { StudyConfigurationModelEnvironment} from "@freon4dsl/samples-study-configuration";
import { ServerCommunication } from "@freon4dsl/core";
import { initializeDatastore } from './services/datastore';

WebappConfigurator.getInstance().setEditorEnvironment(StudyConfigurationModelEnvironment.getInstance());
WebappConfigurator.getInstance().setServerCommunication(ServerCommunication.getInstance());

Amplify.configure(awsconfig);

async function initializeApp() {
  await initializeDatastore();

  const app = new App({
    target: document.body,
    props: {
      // you can pass props here if needed
    }
  });

  return app;
}

export default initializeApp();