
# Helm chart for Dochub

Dochub is ArchOps tool. Dochub allows describing architecture as a code.

## Prerequisites

- Kubernetes 1.23+
- Helm 3.8.0+

## Installing the Chart

To install the chart with the release name `my-release`:

```console
helm install my-release helm/dochub -f helm/dochub/values.yaml
```

> **Tip**: List all releases using `helm list`

### Securing traffic using TLS

Dochub can encrypt communications by setting `tls` values. The chart allows configuration option:

- Provide your own secret using the `tls.secretName` value. Also set the correct name of the `YOUR_HOST` value.

### Use a different version

To modify the application version used in this chart, specify a different version of the image using the `image.tag` parameter and/or a different repository using the `image.repository` parameter.

Specify each parameter using the `--set key=value[,key=value]` argument to `helm install`. For example,

```console
helm install my-release \
  --set image.tag=1.1 \
    helm/dochub -f helm/dochub/values.yaml
```

### Adding environment variables

In case you want to add environment variables, you can use the `vars` property.

```yaml
vars:
  VUE_APP_DOCHUB_MODE: backend
```

### Setting Pod's affinity

This chart allows you to set your custom affinity using the `affinity` parameter. Find more information about Pod's affinity in the [kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity).


### Ingress

This chart provides support for ingress resources. If you have an ingress controller installed on your cluster, such as [nginx-ingress-controller](https://github.com/bitnami/charts/tree/main/bitnami/nginx-ingress-controller) you can utilize the ingress controller to serve your application.

To enable ingress integration, please set `ingress.enabled` to `true`.

## Parameters

### Common parameters

| Name                     | Description                                                                             | Value           |
| ------------------------ | --------------------------------------------------------------------------------------- | --------------- |
| `nameOverride`           | String to partially override dochub.fullname template (will maintain the release name)   | `""`            |
| `fullnameOverride`       | String to fully override dochub.fullname template                                        | `""`            |


### Dochub parameters

| Name                           | Description                                                                                           | Value                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------- |
| `image.repository`             | Dochub image repository                                                                                | `REPOSITORY_NAME/dochub` |
| `image.pullPolicy`             | Dochub image pull policy                                                                               | `Always`          |
| `image.pullSecrets`            | Specify docker-registry secret names as an array                                                      | `[]`                    |
| `command`                      | Override default container command (useful when using custom images)                                  | `[]`                    |
| `args`                         | Override default container args (useful when using custom images)                                     | `[]`                    |
| `vars`                 | Environment variables to be set on Dochub containers                                             | `[]`                    |


## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
