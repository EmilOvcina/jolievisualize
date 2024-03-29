package emilovcina.jolievisualize.Deployment;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.json.simple.JSONObject;

import emilovcina.jolievisualize.System.JolieSystem;

public class Build {

    public enum BuildMethod {
        DOCKER_COMPOSE, KUBERNETES
    }

    /**
     * Class representing a docker image folder
     */
    public class BuildFolder {
        public String name;
        public String mainFile;
        public String target;
        public List<String> files = new ArrayList<>();
        public List<Integer> exposed = new ArrayList<>();
        public String params;
        public String args;
        public List<String> volumes = new ArrayList<>();
    }

    private final JolieSystem system;
    private final List<BuildFolder> folders;
    private String deploymentString;

    public Build(JolieSystem system, BuildMethod method, String buildFolder) {
        this.system = system;
        this.folders = createFolders();

        switch (method) {
            case DOCKER_COMPOSE:
                deploymentString = new DockerCompose(this.system, folders, buildFolder).generateComposeFile();
                break;
            case KUBERNETES:
                // ! not implemented
                break;
        }
    }

    /**
     * Makes this class into a JSON object containing build folders and deployment
     * yaml
     *
     * @return JSONObject
     */
    public JSONObject toJSON() {
        Map<String, Object> map = new HashMap<>();

        List<JSONObject> foldersJSON = new ArrayList<>();
        folders.forEach(folder -> {
            Map<String, Object> tmp = new HashMap<>();
            tmp.put("name", folder.name);
            tmp.put("main", folder.mainFile);
            tmp.put("target", folder.target);
            tmp.put("args", folder.args);
            tmp.put("files", folder.files);
            if (folder.params != null)
                tmp.put("params", folder.params);
            if (folder.volumes.size() > 0)
                tmp.put("volumes", folder.volumes);
            if (folder.exposed != null && folder.exposed.size() > 0)
                tmp.put("expose", folder.exposed);
            foldersJSON.add(new JSONObject(tmp));
        });
        map.put("folders", foldersJSON);
        map.put("deployment", deploymentString);
        return new JSONObject(map);
    }

    /**
     * Creates build folders from the networks of the system
     * 
     * @return List of build folder objects
     */
    private List<BuildFolder> createFolders() {
        List<BuildFolder> res = new ArrayList<>();
        system.getNetworks().forEach(network -> {
            network.getServices().forEach(service -> {
                if (service.getImage() != null)
                    return;
                BuildFolder bf = new BuildFolder();
                bf.name = service.getId() + service.getName();
                bf.target = service.getName();
                bf.mainFile = service.getUri();
                bf.args = service.getArgs();
                bf.files.addAll(service.getDependencies());
                if (service.getParamFile() != null) {
                    bf.params = service.getParamFile();
                    bf.files.add(service.getParamFile());
                } else if (service.getParamJSON() != null) {
                    bf.params = service.getParamJSON().toJSONString();
                }
                if (service.getVolumes().size() > 0)
                    bf.volumes.addAll(service.getVolumes());
                if (service.getInputPorts().size() > 0)
                    bf.exposed.addAll(DeployUtils.getExposedPorts(service.getInputPorts()));
                if (service.getPorts().size() > 0)
                    bf.exposed.addAll(service.getPorts().values());

                BuildFolder tmp = containsBuildFolder(bf, res);
                if (tmp == null)
                    res.add(bf);
                else {
                    tmp.volumes.addAll(bf.volumes);
                }
            });
        });
        return res;
    }

    /**
     * Checks if a build folder is contained in a list of build folders
     * 
     * @param bf   Build folder to check
     * @param list List of build folders
     * @return null if build folder is not contained, else, the matching build
     *         folder in the list.
     */
    private BuildFolder containsBuildFolder(BuildFolder bf, List<BuildFolder> list) {
        List<BuildFolder> res = list.stream()
                .filter(t -> bf.files.containsAll(t.files) && t.files.containsAll(bf.files)
                        && t.mainFile.equals(bf.mainFile) && DeployUtils.checkStringAttribute(bf.params, t.params)
                        && DeployUtils.checkStringAttribute(bf.args, t.args)
                        && DeployUtils.checkStringAttribute(bf.target, t.target))
                .collect(Collectors.toList());
        return res.isEmpty() ? null : res.get(0);
    }
}
