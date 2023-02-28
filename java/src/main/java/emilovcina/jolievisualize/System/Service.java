package emilovcina.jolievisualize.System;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.json.simple.JSONObject;

import emilovcina.jolievisualize.CodeRange;
import jolie.lang.parse.ast.ExecutionInfo;

public class Service {
    private String name;
    private long id;
    private ExecutionInfo executionInfo;

    private String uri;
    private String paramFile;
    private JSONObject paramJSON;
    private JSONObject envJSON;

    private List<OutputPort> outputPorts = new ArrayList<>();
    private List<InputPort> inputPorts = new ArrayList<>();
    private List<Courier> couriers = new ArrayList<>();

    private List<Service> children;
    private Service parent;
    private String bindingPortName;

    private String image;

    private List<CodeRange> codeRanges = new ArrayList<>();
    private Set<String> dependencies = new HashSet<>();
    private List<String> volumes = new ArrayList<>();
    private String args;

    public Service(long id) {
        this.id = id;
        children = new ArrayList<>();
    }

    public JSONObject toJSON() {
        Map<String, Object> map = new HashMap<>();

        map.put("name", name);
        map.put("execution", getExecution());
        map.put("id", id);

        if (codeRanges.size() > 0 && uri != null && uri.length() > 0) {
            List<JSONObject> codeRangeTmp = new ArrayList<>();
            codeRanges.forEach(cr -> {
                codeRangeTmp.add(cr.toJSON());
            });
            map.put("ranges", codeRangeTmp);
        }

        if (image != null)
            map.put("image", image);

        if (uri != null && uri.length() > 0)
            map.put("file", uri);

        if (paramFile != null && paramFile.length() > 0)
            map.put("paramFile", paramFile);
        else if (paramJSON != null)
            map.put("params", paramJSON);

        if (bindingPortName != null)
            map.put("parentPort", bindingPortName);

        if (volumes.size() > 0)
            map.put("volumes", volumes);

        if (args != null)
            map.put("args", args);

        if (envJSON != null)
            map.put("env", envJSON);

        if (outputPorts.size() > 0) {
            List<JSONObject> opListTmp = new ArrayList<>();
            for (OutputPort op : outputPorts)
                opListTmp.add(op.toJSON());
            map.put("outputPorts", opListTmp);
        }

        if (inputPorts.size() > 0) {
            List<JSONObject> ipListTmp = new ArrayList<>();
            for (InputPort ip : inputPorts)
                ipListTmp.add(ip.toJSON());
            map.put("inputPorts", ipListTmp);
        }

        if (children.size() > 0) {
            List<JSONObject> childTmp = new ArrayList<>();
            for (Service s : children)
                childTmp.add(s.toJSON());
            map.put("embeddings", childTmp);
        }

        return new JSONObject(map);
    }

    public String getArgs() {
        return args;
    }

    public void setArgs(String args) {
        this.args = args;
    }

    public void addDependencyFile(String filePath) {
        if (filePath.equalsIgnoreCase(this.uri) || filePath.equals(""))
            return;
        this.dependencies.add(filePath);
    }

    public List<Courier> getCouriers() {
        return this.couriers;
    }

    public Set<String> getDependencies() {
        return this.dependencies;
    }

    public String getImage() {
        return image;
    }

    public String getParamFile() {
        return this.paramFile;
    }

    public List<String> getVolumes() {
        return this.volumes;
    }

    public void addVolume(String conf) {
        this.volumes.add(conf);
    }

    public void addCourier(Courier c) {
        couriers.add(c);
    }

    public void addOutputPort(OutputPort op) {
        outputPorts.add(op);
    }

    public void addInputPort(InputPort ip) {
        inputPorts.add(ip);
    }

    public void setName(String n) {
        this.name = n;
    }

    public void setBindingPortName(String n) {
        this.bindingPortName = n;
    }

    public void setParent(Service s) {
        parent = s;
    }

    public void addChild(Service s) {
        children.add(s);
    }

    public void setUri(String uri) {
        this.uri = uri;
    }

    public void setParamFile(String filename) {
        this.paramFile = filename;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public void removeChildWithID(long id) {
        for (int i = 0; i < children.size(); i++)
            if (children.get(i).id == id) {
                children.remove(i);
                return;
            }
    }

    public JSONObject getEnvJSON() {
        return envJSON;
    }

    public void setEnvJSON(JSONObject envJSON) {
        this.envJSON = envJSON;
    }

    public String getName() {
        return this.name;
    }

    public long getId() {
        return this.id;
    }

    public Service getParent() {
        return parent;
    }

    public List<Service> getChildren() {
        return children;
    }

    public String getUri() {
        return uri;
    }

    public List<InputPort> getInputPorts() {
        return inputPorts;
    }

    public List<OutputPort> getOutputPorts() {
        return outputPorts;
    }

    public String getExecution() {
        if (executionInfo == null)
            return "single";
        return executionInfo.mode().name().toLowerCase();
    }

    public void setExectionInfo(ExecutionInfo ei) {
        this.executionInfo = ei;
    }

    public void addCodeRange(CodeRange cr) {
        codeRanges.add(cr);
    }

    public void setParamJSON(JSONObject params) {
        this.paramJSON = params;
    }

    public JSONObject getParamJSON() {
        return this.paramJSON;
    }
}