import { LOG } from "../config";
import { type loaderData, type feature } from "../types/general";
import { editButtonModule } from "./repo/edit_button";
import { pieChartModule } from "./repo/pie_chart_lang_display";

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

        repoModule.mounted = false;
    }
}