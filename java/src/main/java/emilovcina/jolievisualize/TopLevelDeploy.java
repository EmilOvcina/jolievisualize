package emilovcina.jolievisualize;

import java.util.ArrayList;
import java.util.List;

import org.json.simple.JSONObject;

public class TopLevelDeploy {
    private String name;
    private long instances;
    private String file;
    private String params;
    private JSONObject paramJSON;
    private JSONObject envJSON;
    private String path;
    private String args;
    private String containerName;

    private String image;
    private List<String> volumes = new ArrayList<>();
    private List<String> ports = new ArrayList<>();

    public TopLevelDeploy() {
        this.instances = 1;
    }

    public TopLevelDeploy(String name) {
        this.name = name;
        this.instances = 1;
    }

    /**
     * Deep copies the object.
     * 
     * @return new topleveldeploy object.
     */
    public TopLevelDeploy copy() {
        TopLevelDeploy res = new TopLevelDeploy();
        res.name = this.name;
        res.instances = this.instances;
        res.file = this.file;
        res.params = this.params;
        res.paramJSON = this.paramJSON;
        res.path = this.path;
        res.args = this.args;
        res.containerName = this.containerName;

        res.image = this.image;
        this.volumes.forEach((p) -> res.volumes.add(p));
        this.ports.forEach((p) -> res.ports.add(p));
        return res;
    }

    /**
     * =============================================
     * LIST ADDERS:
     */
    public void addPort(String port) {
        this.ports.add(port);
    }

    public void addVolume(String filename) {
        this.volumes.add(filename);
    }

    /**
     * =============================================
     * GETTERS AND SETTERS:
     */
    public String getArgs() {
        return args;
    }

    public void setArgs(String args) {
        this.args = args;
    }

    public JSONObject getParamJSON() {
        return this.paramJSON;
    }

    public void setParamJSON(JSONObject o) {
        this.paramJSON = o;
    }

    public JSONObject getEnvJSON() {
        return envJSON;
    }

    public void setEnvJSON(JSONObject envJSON) {
        this.envJSON = envJSON;
    }

    public String getImage() {
        return this.image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getContainerName() {
        return this.containerName;
    }

    public void setContainerName(String name) {
        this.containerName = name;
    }

    public List<String> getPorts() {
        return this.ports;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getPath() {
        return this.path;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFilename() {
        return this.file;
    }

    public void setFilename(String filename) {
        this.file = filename;
    }

    public List<String> getVolumes() {
        return this.volumes;
    }

    public void setNumberOfInstances(long number) {
        this.instances = number;
    }

    public long getNumberOfInstances() {
        return this.instances;
    }

    public void setParams(String params) {
        this.params = params;
    }

    public String getParams() {
        return this.params;
    }

}
