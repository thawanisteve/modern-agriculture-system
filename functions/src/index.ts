import { startFlowServer } from '@genkit-ai/express';
import {agriRentalAssistantFlow, menuSuggestionFlow} from './chatbot-flow';


startFlowServer({
  flows: [menuSuggestionFlow, agriRentalAssistantFlow],
})
