import { LOG } from "../config";
import { type loaderData, type feature } from "../types/general";
import { editButtonModule } from "./repo/edit_button";
import { pieChartModule } from "./repo/pie_chart_lang_display";
import { quickActionsModule } from "./repo/quick_actions";

export const repoModule: loaderData = {
    mounted: false,
    mount: (languagesGlobalIn: Map<string, { color: string }>, featureSet?: Map<string, feature>) => {
        if (repoModule.mounted) {
            LOG.warn("Repo module is already mounted.");
            return;
        }

        if (featureSet?.get("pie_chart_lang_display") && !pieChartModule.mounted) {
            pieChartModule.mount(languagesGlobalIn);
        }
        if (featureSet?.get("edit_button") && !editButtonModule.mounted) {
            editButtonModule.mount(languagesGlobalIn);
        }

        if (featureSet?.get("file_hover_quick_actions") && !quickActionsModule.mounted) {
            quickActionsModule.mount(languagesGlobalIn);
        }

        repoModule.mounted = true;
    },
    unmount: () => {
        if (!repoModule.mounted) {
            LOG.warn("Repo module is not mounted.");
            return;
        }

        if (pieChartModule.mounted) {
            pieChartModule.unmount();
        }

        if (editButtonModule.mounted) {
            editButtonModule.unmount();
        }

        if (quickActionsModule.mounted) {
            quickActionsModule.unmount();
        }

        repoModule.mounted = false;
    }
}