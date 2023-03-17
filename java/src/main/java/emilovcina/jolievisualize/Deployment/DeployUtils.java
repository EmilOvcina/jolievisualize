package emilovcina.jolievisualize.Deployment;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import emilovcina.jolievisualize.System.InputPort;

public class DeployUtils {

    public static Set<Integer> getExposedPorts(List<InputPort> portList) {
        Set<Integer> seenPorts = new HashSet<>();
        portList.forEach(port -> {
            if (port.getLocation().equalsIgnoreCase("local") || port.getLocation().endsWith(".ini")
                    || !port.getLocation().contains(":"))
                return;
            if (!isNumeric(port.getLocation().substring(port.getLocation().lastIndexOf(":") + 1).split("/")[0]))
                return;
            seenPorts.add(
                    Integer.parseInt(
                            port.getLocation().substring(port.getLocation().lastIndexOf(":") + 1).split("/")[0]));
        });
        return seenPorts;
    }

    public static boolean checkStringAttribute(String attr1, String attr2) {
        if (attr1 == null && attr2 == null)
            return true;
        return ((attr2 == null) == (attr1 == null)) && attr2.equals(attr1);
    }

    private static boolean isNumeric(String strNum) {
        if (strNum == null)
            return false;
        try {
            Double.parseDouble(strNum);
        } catch (NumberFormatException nfe) {
            return false;
        }
        return true;
    }
}
